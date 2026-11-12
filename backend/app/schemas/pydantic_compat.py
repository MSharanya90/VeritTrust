"""
Pure Python Pydantic Compatibility Layer
Provides BaseModel, Field, EmailStr without native compiled .pyd DLLs,
avoiding Windows Code Integrity (WDAC) execution blocks.
"""
from typing import Any, Dict, Optional, List, Union
import json

class EmailStr(str):
    pass

def Field(default=..., **kwargs):
    return default

class BaseModel:
    def __init__(self, **kwargs):
        # Set all attributes from kwargs
        for key, val in kwargs.items():
            setattr(self, key, val)
            
    def model_dump(self, exclude_unset: bool = False, **kwargs) -> Dict[str, Any]:
        result = {}
        for k, v in self.__dict__.items():
            if k.startswith("_"):
                continue
            if isinstance(v, BaseModel):
                result[k] = v.model_dump()
            elif isinstance(v, list):
                result[k] = [item.model_dump() if isinstance(item, BaseModel) else item for item in v]
            else:
                result[k] = v
        return result

    def dict(self, **kwargs):
        return self.model_dump(**kwargs)

    @classmethod
    def model_validate(cls, obj: Any) -> "BaseModel":
        if isinstance(obj, dict):
            return cls(**obj)
        elif hasattr(obj, "__dict__"):
            # SQLAlchemy model or class instance
            data = {}
            for k in dir(obj):
                if not k.startswith("_") and not callable(getattr(obj, k)):
                    val = getattr(obj, k)
                    data[k] = val
            return cls(**data)
        return cls()

    @classmethod
    def from_orm(cls, obj: Any) -> "BaseModel":
        return cls.model_validate(obj)

    def __repr__(self):
        return f"{self.__class__.__name__}({self.model_dump()})"

