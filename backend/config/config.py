from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # 数据库配置
    DB_HOST: str = Field(default="192.168.10.100")
    DB_PORT: int = Field(default=3310)
    DB_USER: str = Field(default="root")
    DB_PASSWORD: str = Field(default="123456")
    DB_NAME: str = Field(default="dreamops_db")
    
    # 应用配置
    APP_NAME: str = Field(default="Dream OP Personal Blog API")
    APP_VERSION: str = Field(default="1.0.0")
    DEBUG: bool = Field(default=True)
    
    # 服务器配置
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    
    # JWT配置
    SECRET_KEY: str = Field(default="your-secret-key-here-change-this-in-production")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    
    # 密码哈希配置
    PASSWORD_HASH_SALT: str = Field(default="your-salt-change-me-in-production")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"

# 创建设置实例
settings = Settings()
