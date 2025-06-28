#!/usr/bin/env python3
"""
批量修復PostgreSQL文件中的ENUM類型重複創建問題
在所有CREATE TYPE前添加DROP TYPE IF EXISTS
"""

import os
import re
import glob

def fix_enum_types(file_path):
    """修復單個文件中的ENUM類型語法"""
    print(f"修復文件: {os.path.basename(file_path)}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    modifications = []
    
    # 找到所有的 CREATE TYPE 語句
    create_type_pattern = r'CREATE TYPE\s+(\w+)\s+AS\s+ENUM\s*\([^)]+\);'
    
    # 收集所有的 ENUM 類型名稱
    enum_types = re.findall(create_type_pattern, content, flags=re.IGNORECASE)
    
    if enum_types:
        # 創建 DROP TYPE IF EXISTS 語句
        drop_statements = []
        for enum_type in enum_types:
            drop_statements.append(f"DROP TYPE IF EXISTS {enum_type} CASCADE;")
            modifications.append(f"  添加: DROP TYPE IF EXISTS {enum_type}")
        
        # 在第一個 CREATE TYPE 前插入所有 DROP 語句
        first_create_type = re.search(create_type_pattern, content, flags=re.IGNORECASE)
        if first_create_type:
            # 檢查是否已經有 DROP TYPE 語句
            if 'DROP TYPE IF EXISTS' not in content:
                # 找到第一個 CREATE TYPE 的位置
                insert_pos = first_create_type.start()
                
                # 在前面插入註釋和 DROP 語句
                drop_section = "\n-- 刪除現有的 ENUM 類型（如果存在）\n"
                drop_section += "\n".join(drop_statements)
                drop_section += "\n\n"
                
                content = content[:insert_pos] + drop_section + content[insert_pos:]
            else:
                modifications.append("  已包含 DROP TYPE 語句，跳過")
    
    # 檢查是否有修改
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ 已修復 {len(enum_types)} 個ENUM類型:")
        for mod in modifications:
            print(mod)
        return True
    else:
        print(f"  - 無需修復或已修復")
        return False

def main():
    # 數據庫目錄路徑
    database_dir = r"c:\Users\ken15.小恩\OneDrive\桌面\GURUlaptop\新增ckeditor版本(編輯中 render 用)\MFEE57-laptopGuru-ckeditor\frontend\data\database"
    
    print("PostgreSQL ENUM類型修復工具")
    print("添加 DROP TYPE IF EXISTS 避免ENUM重複創建錯誤")
    print("=" * 60)
    
    # 找到所有PostgreSQL文件
    postgres_files = glob.glob(os.path.join(database_dir, "*_postgres.sql"))
    
    if not postgres_files:
        print("未找到PostgreSQL文件")
        return
    
    print(f"找到 {len(postgres_files)} 個PostgreSQL文件")
    print("-" * 40)
    
    # 只處理包含 CREATE TYPE 的文件
    files_with_enum = []
    for file_path in postgres_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'CREATE TYPE' in content:
            files_with_enum.append(file_path)
    
    print(f"包含ENUM類型的文件: {len(files_with_enum)}")
    print("-" * 40)
    
    fixed_count = 0
    for file_path in files_with_enum:
        if fix_enum_types(file_path):
            fixed_count += 1
        print()
    
    print("=" * 60)
    print(f"ENUM類型修復完成！")
    print(f"檢查文件數: {len(files_with_enum)}")
    print(f"已修復文件: {fixed_count}")
    print(f"無需修復: {len(files_with_enum) - fixed_count}")
    print("\n現在所有文件都可以安全重複執行，不會出現ENUM重複創建錯誤！")

if __name__ == "__main__":
    main()
