from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class CMDBConfigItem(Base):
    __tablename__ = "cmdb_config_items"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    environment = Column(String(20), nullable=False)
    business_line = Column(String(100))
    owner = Column(String(100))
    create_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    update_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    tags = Column(Text)
    
    ip = Column(String(50))
    hostname = Column(String(100))
    os = Column(String(100))
    cpu = Column(Integer)
    memory = Column(Integer)
    disk = Column(Integer)
    ssh_port = Column(Integer)
    ssh_username = Column(String(100))
    ssh_password = Column(String(255))
    ssh_private_key = Column(Text)
    
    device_type = Column(String(100))
    location = Column(String(255))
    
    version = Column(String(50))
    deploy_path = Column(String(255))
    
    middleware_type = Column(String(100))
    middleware_category = Column(String(50))
    port = Column(Integer)
    username = Column(String(100))
    
    db_type = Column(String(100))
    database_name = Column(String(100))
    instance_name = Column(String(100))
    storage_size = Column(Integer)
    backup_policy = Column(String(255))
    connection_string = Column(String(255))
    
    mq_type = Column(String(100))
    queue_name = Column(String(100))
    message_model = Column(String(100))
    
    app_server_type = Column(String(100))
    jvm_params = Column(Text)
    
    cloud_provider = Column(String(100))
    region = Column(String(100))
    
    relationships_as_source = relationship("CMDBRelationship", foreign_keys="CMDBRelationship.source", back_populates="source_item")
    relationships_as_target = relationship("CMDBRelationship", foreign_keys="CMDBRelationship.target", back_populates="target_item")

class CMDBRelationship(Base):
    __tablename__ = "cmdb_relationships"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), ForeignKey("cmdb_config_items.id"), nullable=False)
    target = Column(String(50), ForeignKey("cmdb_config_items.id"), nullable=False)
    type = Column(String(50), nullable=False)
    
    source_item = relationship("CMDBConfigItem", foreign_keys=[source], back_populates="relationships_as_source")
    target_item = relationship("CMDBConfigItem", foreign_keys=[target], back_populates="relationships_as_target")

class CMDTag(Base):
    __tablename__ = "cmdb_tags"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    color = Column(String(50), nullable=False)