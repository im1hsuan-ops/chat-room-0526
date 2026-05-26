import json
import logging
import os
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

TABLE_NAME = os.environ["TABLE_NAME"]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def _broadcast(domain_name: str, stage: str, payload: dict) -> None:
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

        # Get callsign before deletion (for broadcast)
        callsign = "unknown"
        try:
            response = table.get_item(Key={"connectionId": connection_id})
            callsign = response.get("Item", {}).get("callsign", "unknown")
        except ClientError as e:
            logger.error("GetItem failed for %s: %s", connection_id, e)

        # Delete the connection record
        table.delete_item(Key={"connectionId": connection_id})
        logger.info("Disconnected: %s (%s)", connection_id, callsign)

        # Broadcast user_left to remaining connections (best-effort)
        if domain_name and domain_name != "localhost":
            try:
                _broadcast(
                    domain_name,
                    stage,
                    payload={
                        "type": "system",
                        "event": "user_left",
                        "callsign": callsign,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
            except Exception as e:
                logger.error("Broadcast user_left failed: %s", e)

        return {"statusCode": 200, "body": "Disconnected"}

    except ClientError as e:
        logger.error("DynamoDB error: %s", e)
        return {"statusCode": 500, "body": "Internal server error"}
    except Exception as e:
        logger.error("Unexpected error: %s", e)
        return {"statusCode": 500, "body": "Internal server error"}
