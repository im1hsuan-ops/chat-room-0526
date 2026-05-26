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


def handler(event, context):
    try:
        ctx = event.get("requestContext", {})
        connection_id = ctx.get("connectionId")
        domain_name = ctx.get("domainName", "")
        stage = ctx.get("stage", "")

        # Parse and validate body
        try:
            body = json.loads(event.get("body") or "")
        except (json.JSONDecodeError, TypeError):
            return {"statusCode": 400, "body": "Missing or invalid text"}

        text = body.get("text", "")
        if not text or not isinstance(text, str) or len(text) > 1000:
            return {"statusCode": 400, "body": "Missing or invalid text"}

        # Get sender's callsign from DynamoDB
        response = table.get_item(Key={"connectionId": connection_id})
        sender = response.get("Item")
        if not sender:
            return {"statusCode": 400, "body": "Unknown sender"}
        callsign = sender["callsign"]

        # Build broadcast payload
        payload = {
            "type": "message",
            "callsign": callsign,
            "text": text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        data = json.dumps(payload).encode("utf-8")

        # Scan all connections (with pagination)
        connections = []
        scan_kwargs: dict = {"ProjectionExpression": "connectionId"}
        while True:
            scan_response = table.scan(**scan_kwargs)
            connections.extend(scan_response["Items"])
            if "LastEvaluatedKey" not in scan_response:
                break
            scan_kwargs["ExclusiveStartKey"] = scan_response["LastEvaluatedKey"]

        # Fan-out via PostToConnection
        endpoint_url = f"https://{domain_name}/{stage}"
        apigw = boto3.client("apigatewaymanagementapi", endpoint_url=endpoint_url)

        for conn in connections:
            conn_id = conn["connectionId"]
            try:
                apigw.post_to_connection(ConnectionId=conn_id, Data=data)
            except apigw.exceptions.GoneException:
                try:
                    table.delete_item(Key={"connectionId": conn_id})
                    logger.info("Removed stale connection: %s", conn_id)
                except ClientError as e:
                    logger.error("Failed to delete stale connection %s: %s", conn_id, e)
            except Exception as e:
                logger.error("Failed to send to %s: %s", conn_id, e)

        logger.info("Broadcast from %s (%s): %s", connection_id, callsign, text[:80])
        return {"statusCode": 200, "body": "Message sent"}

    except ClientError as e:
        logger.error("DynamoDB error: %s", e)
        return {"statusCode": 500, "body": "Internal server error"}
    except Exception as e:
        logger.error("Unexpected error: %s", e)
        return {"statusCode": 500, "body": "Internal server error"}
