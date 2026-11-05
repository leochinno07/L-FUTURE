import os
from urllib.parse import quote


def remote_storage_configured() -> bool:
    return all(os.environ.get(key) for key in (
        'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'ASSET_PUBLIC_BASE_URL'
    ))


def public_asset_url(filename: str) -> str:
    base_url = os.environ.get('ASSET_PUBLIC_BASE_URL', '').rstrip('/')
    if remote_storage_configured():
        return '{}/{}'.format(base_url, quote(filename))
    return '/uploads/' + quote(filename)


def upload_remote_asset(filename: str, content: bytes, mime_type: str) -> None:
    import boto3

    endpoint_url = os.environ.get('S3_ENDPOINT_URL')
    region = os.environ.get('S3_REGION', 'auto' if endpoint_url else 'us-east-1')
    client = boto3.client(
        's3',
        endpoint_url=endpoint_url,
        region_name=region,
        aws_access_key_id=os.environ['S3_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['S3_SECRET_ACCESS_KEY']
    )
    client.put_object(
        Bucket=os.environ['S3_BUCKET'],
        Key=filename,
        Body=content,
        ContentType=mime_type,
        CacheControl='public, max-age=31536000, immutable'
    )


def delete_remote_asset(filename: str) -> None:
    import boto3

    endpoint_url = os.environ.get('S3_ENDPOINT_URL')
    region = os.environ.get('S3_REGION', 'auto' if endpoint_url else 'us-east-1')
    client = boto3.client(
        's3',
        endpoint_url=endpoint_url,
        region_name=region,
        aws_access_key_id=os.environ['S3_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['S3_SECRET_ACCESS_KEY']
    )
    client.delete_object(Bucket=os.environ['S3_BUCKET'], Key=filename)