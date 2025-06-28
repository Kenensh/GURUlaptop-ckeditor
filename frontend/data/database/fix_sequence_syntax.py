#!/usr/bin/env python3
"""
修復所有PostgreSQL文件中的序列重置語法問題
將 SELECT setval() 替換為正確的 ALTER SEQUENCE 語法
"""

import os
import re
import glob

def fix_sequence_syntax(file_path):
    """修復單個文件中的序列語法"""
    print(f"修復文件: {os.path.basename(file_path)}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    modifications = []
    
    # 模式1: SELECT setval('sequence_name', (SELECT MAX(column) FROM table), true);
    pattern1 = r"SELECT setval\('([^']+)',\s*\(SELECT MAX\(([^)]+)\) FROM ([^)]+)\),\s*true\);"
    def replace1(match):
        seq_name = match.group(1)
        column_name = match.group(2)
        table_name = match.group(3)
        modifications.append(f"  修復: {seq_name} 序列重置")
        return f"-- 重置序列到下一個可用ID\nDO $$\nBEGIN\n    PERFORM setval('{seq_name}', COALESCE((SELECT MAX({column_name}) FROM {table_name}), 0) + 1, false);\nEND $$;"
    
    content = re.sub(pattern1, replace1, content)
    
    # 模式2: SELECT setval('sequence_name', (SELECT MAX(column) FROM table));
    pattern2 = r"SELECT setval\('([^']+)',\s*\(SELECT MAX\(([^)]+)\) FROM ([^)]+)\)\);"
    def replace2(match):
        seq_name = match.group(1)
        column_name = match.group(2)
        table_name = match.group(3)
        modifications.append(f"  修復: {seq_name} 序列重置")
        return f"-- 重置序列到下一個可用ID\nDO $$\nBEGIN\n    PERFORM setval('{seq_name}', COALESCE((SELECT MAX({column_name}) FROM {table_name}), 0) + 1, false);\nEND $$;"
    
    content = re.sub(pattern2, replace2, content)
    
    # 模式3: SELECT setval('sequence_name', number, false);
    pattern3 = r"SELECT setval\('([^']+)',\s*(\d+),\s*false\);"
    def replace3(match):
        seq_name = match.group(1)
        number = match.group(2)
        modifications.append(f"  修復: {seq_name} 序列重置到 {number}")
        return f"ALTER SEQUENCE {seq_name} RESTART WITH {number};"
    
    content = re.sub(pattern3, replace3, content)
    
    # 模式4: 複雜的 pg_get_serial_sequence 語法
    pattern4 = r"SELECT setval\(pg_get_serial_sequence\('([^']+)',\s*'([^']+)'\),\s*COALESCE\(MAX\(([^)]+)\),\s*1\)\)\s*FROM\s+([^;]+);"
    def replace4(match):
        table_name = match.group(1)
        column = match.group(2)
        max_column = match.group(3)
        from_table = match.group(4)
        seq_name = f"{table_name.replace('public.', '')}_{column}_seq"
        modifications.append(f"  修復: {seq_name} 序列重置")
        return f"-- 重置序列到下一個可用ID\nDO $$\nBEGIN\n    PERFORM setval(pg_get_serial_sequence('{table_name}', '{column}'), COALESCE((SELECT MAX({max_column}) FROM {from_table}), 0) + 1, false);\nEND $$;"
    
    content = re.sub(pattern4, replace4, content)
    
    # 模式5: 帶有public schema的setval
    pattern5 = r"SELECT setval\('public\.([^']+)',\s*\(SELECT MAX\(([^)]+)\) FROM ([^)]+)\)\);"
    def replace5(match):
        seq_name = match.group(1)
        column_name = match.group(2)
        table_name = match.group(3)
        modifications.append(f"  修復: public.{seq_name} 序列重置")
        return f"-- 重置序列到下一個可用ID\nDO $$\nBEGIN\n    PERFORM setval('public.{seq_name}', COALESCE((SELECT MAX({column_name}) FROM {table_name}), 0) + 1, false);\nEND $$;"
    
    content = re.sub(pattern5, replace5, content)
    
    # 檢查是否有修改
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ 已修復 {len(modifications)} 個問題:")
        for mod in modifications:
            print(mod)
        return True
    else:
        print(f"  - 無需修復")
        return False

def main():
    # 數據庫目錄路徑
    database_dir = r"c:\Users\ken15.小恩\OneDrive\桌面\GURUlaptop\新增ckeditor版本(編輯中 render 用)\MFEE57-laptopGuru-ckeditor\frontend\data\database"
    
    print("PostgreSQL序列語法修復工具")
    print("=" * 50)
    
    # 找到所有PostgreSQL文件
    postgres_files = glob.glob(os.path.join(database_dir, "*_postgres.sql"))
    
    if not postgres_files:
        print("未找到PostgreSQL文件")
        return
    
    print(f"找到 {len(postgres_files)} 個PostgreSQL文件")
    print("-" * 30)
    
    fixed_count = 0
    for file_path in postgres_files:
        if fix_sequence_syntax(file_path):
            fixed_count += 1
        print()
    
    print("=" * 50)
    print(f"修復完成！")
    print(f"總文件數: {len(postgres_files)}")
    print(f"已修復文件: {fixed_count}")
    print(f"無需修復: {len(postgres_files) - fixed_count}")

if __name__ == "__main__":
    main()
