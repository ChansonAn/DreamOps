from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Script(Base):
    __tablename__ = "scripts"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), index=True, nullable=False)
    category = Column(String(100), nullable=False)
    language = Column(String(50), nullable=False)
    creator = Column(String(100), nullable=False)
    create_time = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)
    version = Column(String(50), nullable=False, default="1.0.0")
    status = Column(String(20), nullable=False, default="启用")
    tags = Column(Text, nullable=True)
    parameters = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    description = Column(Text, nullable=True)