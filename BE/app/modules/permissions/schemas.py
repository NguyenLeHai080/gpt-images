from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class RoleInfo(BaseModel):
    code: str
    name: str
    description: str
    badge_color: str
    user_count: int
    is_system: bool = False

class PermissionAction(BaseModel):
    key: str
    label: str
    description: str

class PermissionGroup(BaseModel):
    module_key: str
    module_name: str
    description: str
    actions: List[PermissionAction]

class RolePermissionsUpdate(BaseModel):
    permissions: List[str]

class PermissionsMatrixResponse(BaseModel):
    roles: List[RoleInfo]
    modules: List[PermissionGroup]
    matrix: Dict[str, List[str]]
