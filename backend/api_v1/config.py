import os


def is_managed_deployment() -> bool:
    return (
        os.environ.get('APP_ENV', '').lower() == 'production'
        or os.environ.get('VERCEL') == '1'
        or os.environ.get('VERCEL_ENV', '').lower() in {'production', 'preview'}
    )