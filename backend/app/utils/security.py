"""Security utilities for credential encryption."""
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.config import settings


def get_encryption_key() -> bytes:
    """Get or generate encryption key."""
    if settings.ENCRYPTION_KEY:
        # Use provided key
        key = settings.ENCRYPTION_KEY.encode()
    else:
        # Generate from SECRET_KEY using PBKDF2
        password = settings.SECRET_KEY.encode()
        salt = b'analytics_salt_2024'  # Fixed salt for consistency
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
    
    return key


def encrypt_credentials(plaintext: str) -> str:
    """Encrypt credentials using Fernet."""
    key = get_encryption_key()
    fernet = Fernet(key)
    encrypted = fernet.encrypt(plaintext.encode())
    return encrypted.decode()


def decrypt_credentials(ciphertext: str) -> str:
    """Decrypt credentials using Fernet."""
    key = get_encryption_key()
    fernet = Fernet(key)
    decrypted = fernet.decrypt(ciphertext.encode())
    return decrypted.decode()


