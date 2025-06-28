#!/usr/bin/env python3
"""
验证PostgreSQL转换质量
"""

import os
import re

def validate_postgres_file(filepath):
    """验证单个PostgreSQL文件的转换质量"""
    print(f"\n验证文件: {os.path.basename(filepath)}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查常见问题
    issues = []
    
    # 检查是否还有MySQL特有语法
    mysql_patterns = [
        (r'AUTO_INCREMENT', 'MySQL AUTO_INCREMENT 未转换'),
        (r'ENGINE\s*=', 'MySQL ENGINE 未转换'),
        (r'CHARSET\s*=', 'MySQL CHARSET 未转换'),
        (r'`[^`]+`', '仍有MySQL反引号'),
        (r"'0000-00-00", 'MySQL零日期未转换'),
        (r'\bTINYINT\b', 'TINYINT未转换为SMALLINT'),
        (r'\bDATETIME\b', 'DATETIME未转换为TIMESTAMP'),
    ]
    
    for pattern, message in mysql_patterns:
        matches = re.findall(pattern, content, flags=re.IGNORECASE)
        if matches:
            issues.append(f"{message}: 发现 {len(matches)} 处")
    
    # 统计信息
    insert_count = len(re.findall(r'^INSERT INTO', content, flags=re.MULTILINE))
    create_table = re.search(r'CREATE TABLE\s+"?(\w+)"?', content, flags=re.IGNORECASE)
    table_name = create_table.group(1) if create_table else "未知"
    
    print(f"  表名: {table_name}")
    print(f"  INSERT语句数量: {insert_count}")
    print(f"  文件大小: {len(content):,} 字符")
    
    if issues:
        print("  发现问题:")
        for issue in issues:
            print(f"    - {issue}")
    else:
        print("  ✓ 转换质量良好")
    
    return len(issues) == 0

def main():
    database_dir = r"c:\Users\ken15.小恩\OneDrive\桌面\GURUlaptop\新增ckeditor版本(編輯中 render 用)\MFEE57-laptopGuru-ckeditor\frontend\data\database"
    
    print("PostgreSQL转换质量验证")
    print("=" * 50)
    
    # 验证重要文件
    important_files = [
        'users_postgres.sql',
        'product_postgres.sql', 
        'product_detail_img_postgres.sql',
        'event_type_postgres.sql',
        'blogcomment_postgres.sql',
        'event_registration_postgres.sql'
    ]
    
    good_files = 0
    total_files = 0
    
    for filename in important_files:
        filepath = os.path.join(database_dir, filename)
        if os.path.exists(filepath):
            total_files += 1
            if validate_postgres_file(filepath):
                good_files += 1
    
    print(f"\n验证总结:")
    print(f"验证文件: {total_files}")
    print(f"转换良好: {good_files}")
    print(f"需要修复: {total_files - good_files}")

if __name__ == "__main__":
    main()
