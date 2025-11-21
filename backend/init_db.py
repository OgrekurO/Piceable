#!/usr/bin/env python3
"""
数据库初始化脚本
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.init_db import init_db

if __name__ == "__main__":
    init_db()