import json
import logging
import os
import re
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

TABLE_NAME = os.environ["TABLE_NAME"]
CALLSIGN_RE = re.compile(r"^[a-zA-Z0-9_]{1,20}$")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def _broadcast(domain_name: str, stage: str, exclude_id: str, payload: dict) -> None:
    endpoint_url = f"https://{domain_name}/{stage}"
    apigw = boto3.client("apigatewaymanagementapi", endpoint_url=endpoint_url)
    data = json.dumps(payload).encode("utf-8")

    connections = []
    scan_kwargs: dict = {"ProjectionExpression": "connectionId"}
    while True:
        response = table.scan(**scan_kwargs)
        connections.extend(response["Items"])
        if "LastEvaluatedKey" not in response:
            break
        scan_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]

    for conn in connections:
        conn_id = conn["connectionId"]
        if conn_id == exclude_id:
            continue
        try:
            apigw.post_to_connection(ConnectionId=conn_id, Data=data)
        except apigw.exceptions.GoneException:
            try:
                table.delete_item(Key={"connectionId": conn_id})
            except ClientError as e:
                logger.error("Failed to delete stale connection %s: %s", conn_id, e)
        except Exception as e:
            logger.error("Failed to send to %s: %s", conn_id, e)


def handler(event, context):
    try:
        ctx = event.get("requestContext", {})
        connection_id = ctx.get("connectionId")
        domain_name = ctx.get("domainName", "")
        stage = ctx.get("stage", "")

        params = event.get("queryStringParameters") or {}
        callsign = params.get("callsign", "").strip()

        if not callsign or not CALLSIGN_RE.match(callsign):
            return {"statusCode": 400, "body": "Invalid or missing callsign"}

        table.put_item(
            Item={
                "connectionId": connection_id,
                "callsign": callsign,
                "connectedAt": datetime.now(timezone.utc).isoformat(),
            }
        )
        logger.info("Connected: %s (%s)", connection_id, callsign)

        # Broadcast user_joined to all existing connections (best-effort)
        if domain_name and domain_name != "localhost":
            try:
                _broadcast(
                    domain_name,
                    stage,
                    exclude_id=connection_id,
                    payload={
                        "type": "system",
                        "event": "user_joined",
                        "callsign": callsign,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
            except Exception as e:
                logger.error("Broadcast user_joined failed: %s", e)

        return {"statusCode": 200, "body": "Connected"}

    except ClientError as e:
        logger.error("DynamoDB error: %s", e)
        return {"statusCode": 500, "body": "Internal server error"}
    except Exception as e:
        logger.error("Unexpected error: %s", e)
        return {"statusCode": 500, "body": "Internal server error"}
