#!/usr/bin/env python3
"""
Security validation script for L-FUTURE
Validates that all required secrets and security configurations are properly set
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

from config import get_config  # type: ignore

def validate_secrets():
    """Validate that all required secrets are set"""
    print("🔐 Validating L-FUTURE security configuration...")

    # Get current configuration
    config = get_config()

    issues = []
    warnings = []

    # Check SECRET_KEY
    if not config.SECRET_KEY or config.SECRET_KEY == 'default-secret-key-change-in-production':
        issues.append("❌ SECRET_KEY is not set or using default value")
    else:
        print("✅ SECRET_KEY is properly configured")

    # Check JWT_SECRET_KEY
    if hasattr(config, 'JWT_SECRET_KEY') and config.JWT_SECRET_KEY:
        if config.JWT_SECRET_KEY != config.SECRET_KEY:
            print("✅ JWT_SECRET_KEY is set separately from SECRET_KEY")
        else:
            warnings.append("⚠️  JWT_SECRET_KEY is the same as SECRET_KEY (acceptable but not ideal)")
    else:
        issues.append("❌ JWT_SECRET_KEY is not set")

    # Check environment-specific validations
    env = os.environ.get('FLASK_ENV', 'development')
    if env == 'production':
        print(f"🏭 Running in PRODUCTION environment")

        # Production-specific checks
        if config.ALLOWED_ORIGINS == '*':
            issues.append("❌ ALLOWED_ORIGINS cannot be '*' in production")

        if config.DEBUG:
            issues.append("❌ DEBUG cannot be True in production")

        if config.DEV_MODE:
            issues.append("❌ DEV_MODE cannot be True in production")

    else:
        print(f"🛠️  Running in {env.upper()} environment")

    # Check file permissions on sensitive files
    sensitive_files = ['backend/.env', '.env']
    for file_path in sensitive_files:
        if os.path.exists(file_path):
            # Check if file is readable by others (basic check)
            import stat
            file_stat = os.stat(file_path)
            if file_stat.st_mode & stat.S_IRGRP or file_stat.st_mode & stat.S_IROTH:
                warnings.append(f"⚠️  {file_path} is readable by group/others - consider chmod 600")

    # Check password policy
    print(f"🔑 Password policy: min_length={config.PASSWORD_MIN_LENGTH}, "
          f"uppercase={config.PASSWORD_REQUIRE_UPPERCASE}, "
          f"numbers={config.PASSWORD_REQUIRE_NUMBERS}, "
          f"special={config.PASSWORD_REQUIRE_SPECIAL}")

    # Summary
    if issues:
        print(f"\n❌ SECURITY ISSUES FOUND ({len(issues)}):")
        for issue in issues:
            print(f"   {issue}")
        return False

    if warnings:
        print(f"\n⚠️  SECURITY WARNINGS ({len(warnings)}):")
        for warning in warnings:
            print(f"   {warning}")

    # All checks passed
    print("\n✅ Security validation completed successfully!")
    return True

if __name__ == '__main__':
    success = validate_secrets()
    sys.exit(0 if success else 1)