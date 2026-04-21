from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any

type ConfigurationItemType = 'host' | 'network' | 'application' | 'middleware' | 'database' | 'cloud'
type StatusType = 'active' | 'inactive' | 'maintenance'
type EnvironmentType = 'dev' | 'test' | 'staging' | 'prod'

class CMDTagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(..., min_length=1, max_length=50)

class CMDTagCreate(CMDTagBase):
    id: Optional[str] = Field(default=None, max_length=50)

class CMDTag(CMDTagBase):
    id: str
    
    class Config:
        from_attributes = True

class CMDBRelationshipBase(BaseModel):
    source: str = Field(..., min_length=1, max_length=50)
    target: str = Field(..., min_length=1, max_length=50)
    type: str = Field(..., min_length=1, max_length=50)

class CMDBRelationshipCreate(CMDBRelationshipBase):
    pass

class CMDBRelationship(CMDBRelationshipBase):
    id: int
    
    class Config:
        from_attributes = True

class CMDBConfigItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., min_length=1, max_length=50)
    status: str = Field(default="active", max_length=20)
    environment: str = Field(default="dev", max_length=20)
    business_line: Optional[str] = Field(None, max_length=100)
    owner: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = Field(default_factory=list)
    
    ip: Optional[str] = Field(None, max_length=50)
    hostname: Optional[str] = Field(None, max_length=100)
    os: Optional[str] = Field(None, max_length=100)
    cpu: Optional[int] = None
    memory: Optional[int] = None
    disk: Optional[int] = None
    ssh_port: Optional[int] = None
    ssh_username: Optional[str] = Field(None, max_length=100)
    ssh_password: Optional[str] = Field(None, max_length=255)
    ssh_private_key: Optional[str] = None
    
    device_type: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    
    version: Optional[str] = Field(None, max_length=50)
    deploy_path: Optional[str] = Field(None, max_length=255)
    
    middleware_type: Optional[str] = Field(None, max_length=100)
    middleware_category: Optional[str] = Field(None, max_length=50)
    port: Optional[int] = None
    username: Optional[str] = Field(None, max_length=100)
    
    db_type: Optional[str] = Field(None, max_length=100)
    database_name: Optional[str] = Field(None, max_length=100)
    instance_name: Optional[str] = Field(None, max_length=100)
    storage_size: Optional[int] = None
    backup_policy: Optional[str] = Field(None, max_length=255)
    connection_string: Optional[str] = Field(None, max_length=255)
    
    mq_type: Optional[str] = Field(None, max_length=100)
    queue_name: Optional[str] = Field(None, max_length=100)
    message_model: Optional[str] = Field(None, max_length=100)
    
    app_server_type: Optional[str] = Field(None, max_length=100)
    jvm_params: Optional[str] = None
    
    cloud_provider: Optional[str] = Field(None, max_length=100)
    region: Optional[str] = Field(None, max_length=100)

class CMDBConfigItemCreate(CMDBConfigItemBase):
    id: Optional[str] = Field(default=None, max_length=50)

class CMDBConfigItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = Field(None, min_length=1, max_length=20)
    environment: Optional[str] = Field(None, min_length=1, max_length=20)
    business_line: Optional[str] = Field(None, max_length=100)
    owner: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    
    ip: Optional[str] = Field(None, max_length=50)
    hostname: Optional[str] = Field(None, max_length=100)
    os: Optional[str] = Field(None, max_length=100)
    cpu: Optional[int] = None
    memory: Optional[int] = None
    disk: Optional[int] = None
    ssh_port: Optional[int] = None
    ssh_username: Optional[str] = Field(None, max_length=100)
    ssh_password: Optional[str] = Field(None, max_length=255)
    ssh_private_key: Optional[str] = None
    
    device_type: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    
    version: Optional[str] = Field(None, max_length=50)
    deploy_path: Optional[str] = Field(None, max_length=255)
    
    middleware_type: Optional[str] = Field(None, max_length=100)
    middleware_category: Optional[str] = Field(None, max_length=50)
    port: Optional[int] = None
    username: Optional[str] = Field(None, max_length=100)
    
    db_type: Optional[str] = Field(None, max_length=100)
    database_name: Optional[str] = Field(None, max_length=100)
    instance_name: Optional[str] = Field(None, max_length=100)
    storage_size: Optional[int] = None
    backup_policy: Optional[str] = Field(None, max_length=255)
    connection_string: Optional[str] = Field(None, max_length=255)
    
    mq_type: Optional[str] = Field(None, max_length=100)
    queue_name: Optional[str] = Field(None, max_length=100)
    message_model: Optional[str] = Field(None, max_length=100)
    
    app_server_type: Optional[str] = Field(None, max_length=100)
    jvm_params: Optional[str] = None
    
    cloud_provider: Optional[str] = Field(None, max_length=100)
    region: Optional[str] = Field(None, max_length=100)

class CMDBConfigItem(CMDBConfigItemBase):
    id: str
    create_time: Optional[datetime] = None
    update_time: Optional[datetime] = None
    
    class Config:
        from_attributes = True