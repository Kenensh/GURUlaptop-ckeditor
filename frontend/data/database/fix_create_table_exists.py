#!/usr/bin/env python3
"""
批量修改PostgreSQL文件，添加 IF NOT EXISTS 或 DROP TABLE IF EXISTS
避免表格已存在的錯誤
"""

import os
import re
import glob

def fix_create_table_syntax(file_path):
    """修改單個文件的CREATE TABLE語法"""
    print(f"修改文件: {os.path.basename(file_path)}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    modifications = []
    
    # 方法1: 在CREATE TABLE前添加DROP TABLE IF EXISTS
    # 找到CREATE TABLE語句
    create_table_pattern = r'CREATE TABLE\s+((?:public\.)?[\w"]+)\s*\('
    
    def add_drop_table(match):
        table_name = match.group(1)
        modifications.append(f"  添加: DROP TABLE IF EXISTS {table_name}")
        return f"-- 如果表格已存在則刪除\nDROP TABLE IF EXISTS {table_name} CASCADE;\n\n{match.group(0)}"
    
    # 只在沒有DROP TABLE的情況下添加
    if 'DROP TABLE IF EXISTS' not in content:
        content = re.sub(create_table_pattern, add_drop_table, content, flags=re.IGNORECASE)
    
    # 方法2: 修改CREATE TABLE為CREATE TABLE IF NOT EXISTS
    # 但這個方法在PostgreSQL中可能有限制，所以我們使用DROP TABLE方法
    
    # 檢查是否有修改
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ 已修改 {len(modifications)} 個CREATE TABLE:")
        for mod in modifications:
            print(mod)
        return True
    else:
        print(f"  - 已經包含DROP TABLE語句，無需修改")
        return False

def main():
    # 數據庫目錄路徑
    database_dir = r"c:\Users\ken15.小恩\OneDrive\桌面\GURUlaptop\新增ckeditor版本(編輯中 render 用)\MFEE57-laptopGuru-ckeditor\frontend\data\database"
    
    print("PostgreSQL CREATE TABLE語法修復工具")
    print("添加 DROP TABLE IF EXISTS 避免表格已存在錯誤")
    print("=" * 60)
    
    # 找到所有PostgreSQL文件
    postgres_files = glob.glob(os.path.join(database_dir, "*_postgres.sql"))
    
    if not postgres_files:
        print("未找到PostgreSQL文件")
        return
    
    print(f"找到 {len(postgres_files)} 個PostgreSQL文件")
    print("-" * 40)
    
    fixed_count = 0
    for file_path in postgres_files:
        if fix_create_table_syntax(file_path):
            fixed_count += 1
        print()
    
    print("=" * 60)
    print(f"修復完成！")
    print(f"總文件數: {len(postgres_files)}")
    print(f"已修改文件: {fixed_count}")
    print(f"無需修改: {len(postgres_files) - fixed_count}")
    print("\n現在所有文件都可以安全重複執行，不會出現'表格已存在'錯誤！")

if __name__ == "__main__":
    main()
