#!/usr/bin/env python3
"""
MySQL to PostgreSQL bulk conversion script for laptopGuru project
Converts all MySQL .sql files to PostgreSQL format
"""

import os
import re
import json
from datetime import datetime

class MySQLToPostgreSQLConverter:
    def __init__(self, directory_path):
        self.directory_path = directory_path
        self.mysql_files = []
        self.conversion_log = []
          def find_mysql_files(self):
        """Find all MySQL files that need conversion"""
        print("Scanning for MySQL files...")
        for filename in os.listdir(self.directory_path):
            if filename.endswith('.sql') and not filename.endswith('_postgres.sql') and filename != 'export_202505240140.sql':
                mysql_file = os.path.join(self.directory_path, filename)
                postgres_file = os.path.join(self.directory_path, filename.replace('.sql', '_postgres.sql'))
                
                # Check if conversion is needed
                mysql_size = os.path.getsize(mysql_file) if os.path.exists(mysql_file) else 0
                postgres_size = os.path.getsize(postgres_file) if os.path.exists(postgres_file) else 0
                
                print(f"  {filename}: {mysql_size:,} bytes → {postgres_size:,} bytes")
                
                # Convert if postgres file doesn't exist or is significantly smaller
                if not os.path.exists(postgres_file) or postgres_size < mysql_size * 0.5:
                    self.mysql_files.append(filename)
                    print(f"    → Will convert")
                else:
                    print(f"    → Already converted")
                    
        return self.mysql_files
    
    def convert_data_types(self, sql_content):
        """Convert MySQL data types to PostgreSQL equivalents"""
        # Data type conversions
        conversions = {
            r'\bTINYINT\b': 'SMALLINT',
            r'\bINT\b': 'INTEGER',
            r'\bBIGINT\b': 'BIGINT',
            r'\bVARCHAR\((\d+)\)': r'VARCHAR(\1)',
            r'\bTEXT\b': 'TEXT',
            r'\bLONGTEXT\b': 'TEXT',
            r'\bMEDIUMTEXT\b': 'TEXT',
            r'\bTIMESTAMP\b': 'TIMESTAMP',
            r'\bDATETIME\b': 'TIMESTAMP',
            r'\bDATE\b': 'DATE',
            r'\bTIME\b': 'TIME',
            r'\bFLOAT\b': 'REAL',
            r'\bDOUBLE\b': 'DOUBLE PRECISION',
            r'\bDECIMAL\((\d+),(\d+)\)': r'DECIMAL(\1,\2)',
            r'\bBOOLEAN\b': 'BOOLEAN',
            r'\bTINYINT\(1\)': 'BOOLEAN',
            r'\bJSON\b': 'JSONB',
        }
        
        for mysql_type, postgres_type in conversions.items():
            sql_content = re.sub(mysql_type, postgres_type, sql_content, flags=re.IGNORECASE)
        
        return sql_content
    
    def convert_syntax(self, sql_content):
        """Convert MySQL-specific syntax to PostgreSQL"""
        # Remove MySQL-specific keywords
        sql_content = re.sub(r'\bAUTO_INCREMENT\b', '', sql_content, flags=re.IGNORECASE)
        sql_content = re.sub(r'\bENGINE\s*=\s*\w+', '', sql_content, flags=re.IGNORECASE)
        sql_content = re.sub(r'\bCHARSET\s*=\s*\w+', '', sql_content, flags=re.IGNORECASE)
        sql_content = re.sub(r'\bCOLLATE\s*=\s*\w+', '', sql_content, flags=re.IGNORECASE)
        sql_content = re.sub(r'\bDEFAULT\s+CHARSET\s*=\s*\w+', '', sql_content, flags=re.IGNORECASE)
        
        # Convert backticks to double quotes for identifiers
        sql_content = re.sub(r'`([^`]+)`', r'"\1"', sql_content)
        
        # Convert INSERT IGNORE to INSERT ... ON CONFLICT DO NOTHING
        sql_content = re.sub(r'\bINSERT\s+IGNORE\s+INTO\b', 'INSERT INTO', sql_content, flags=re.IGNORECASE)
        
        # Handle ENUM types - we'll need to extract and create them separately
        enum_pattern = r'\b(\w+)\s+ENUM\s*\(([^)]+)\)'
        enums = re.findall(enum_pattern, sql_content, flags=re.IGNORECASE)
        
        enum_definitions = []
        for column_name, enum_values in enums:
            # Clean up enum values
            enum_values_clean = re.findall(r"'([^']*)'", enum_values)
            if enum_values_clean:
                enum_type_name = f"{column_name}_enum"
                enum_def = f"CREATE TYPE {enum_type_name} AS ENUM ({', '.join([f\"'{val}'\" for val in enum_values_clean])});\n"
                enum_definitions.append(enum_def)
                # Replace ENUM definition with type reference
                sql_content = re.sub(
                    rf'\b{column_name}\s+ENUM\s*\([^)]+\)',
                    f'{column_name} {enum_type_name}',
                    sql_content,
                    flags=re.IGNORECASE
                )
        
        return sql_content, enum_definitions
    
    def convert_timestamps(self, sql_content):
        """Convert MySQL timestamp formats to PostgreSQL"""
        # Convert '0000-00-00 00:00:00' to NULL
        sql_content = re.sub(r"'0000-00-00 00:00:00'", 'NULL', sql_content)
        sql_content = re.sub(r"'0000-00-00'", 'NULL', sql_content)
        
        # Convert CURRENT_TIMESTAMP
        sql_content = re.sub(r'\bCURRENT_TIMESTAMP\b', 'CURRENT_TIMESTAMP', sql_content, flags=re.IGNORECASE)
        
        return sql_content
    
    def extract_table_name(self, sql_content):
        """Extract table name from CREATE TABLE statement"""
        match = re.search(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?', sql_content, flags=re.IGNORECASE)
        return match.group(1) if match else None
    
    def add_sequence_reset(self, sql_content, table_name):
        """Add sequence reset for auto-increment columns"""
        # Look for INSERT statements to find the maximum ID
        insert_pattern = rf'INSERT\s+INTO\s+`?{table_name}`?\s*\([^)]*\)\s+VALUES\s*\(([^)]+)\)'
        inserts = re.findall(insert_pattern, sql_content, flags=re.IGNORECASE | re.DOTALL)
        
        if inserts:
            max_id = 0
            for insert_values in inserts:
                # Extract first value (usually ID)
                first_value = insert_values.split(',')[0].strip()
                try:
                    id_val = int(first_value)
                    max_id = max(max_id, id_val)
                except ValueError:
                    continue
            
            if max_id > 0:
                sequence_reset = f"\n-- Reset sequence for {table_name}\nSELECT setval('{table_name}_id_seq', {max_id + 1});\n"
                return sql_content + sequence_reset
        
        return sql_content
    
    def process_insert_statements(self, sql_content):
        """Process INSERT statements for better PostgreSQL compatibility"""
        # Handle complex INSERT statements with multiple values
        lines = sql_content.split('\n')
        processed_lines = []
        
        for line in lines:
            if re.match(r'^\s*INSERT\s+INTO', line, flags=re.IGNORECASE):
                # Ensure proper formatting
                line = re.sub(r'\s+', ' ', line.strip())
                
            processed_lines.append(line)
        
        return '\n'.join(processed_lines)
    
    def convert_file(self, mysql_filename):
        """Convert a single MySQL file to PostgreSQL format"""
        mysql_path = os.path.join(self.directory_path, mysql_filename)
        postgres_filename = mysql_filename.replace('.sql', '_postgres.sql')
        postgres_path = os.path.join(self.directory_path, postgres_filename)
        
        try:
            # Read MySQL file
            with open(mysql_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            # Extract table name
            table_name = self.extract_table_name(sql_content)
            
            # Apply conversions
            sql_content = self.convert_data_types(sql_content)
            sql_content, enum_definitions = self.convert_syntax(sql_content)
            sql_content = self.convert_timestamps(sql_content)
            sql_content = self.process_insert_statements(sql_content)
            
            # Add sequence reset if applicable
            if table_name:
                sql_content = self.add_sequence_reset(sql_content, table_name)
            
            # Prepare final content with header
            header = f"""-- PostgreSQL version of {mysql_filename}
-- Converted from MySQL on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Table: {table_name if table_name else 'Unknown'}

"""
            
            # Add ENUM definitions at the beginning if any
            if enum_definitions:
                header += "-- ENUM type definitions\n"
                header += ''.join(enum_definitions)
                header += "\n"
            
            final_content = header + sql_content
            
            # Write PostgreSQL file
            with open(postgres_path, 'w', encoding='utf-8') as f:
                f.write(final_content)
            
            # Log conversion
            original_size = os.path.getsize(mysql_path)
            converted_size = os.path.getsize(postgres_path)
            
            self.conversion_log.append({
                'file': mysql_filename,
                'table': table_name,
                'original_size': original_size,
                'converted_size': converted_size,
                'status': 'success'
            })
            
            print(f"✓ Converted {mysql_filename} → {postgres_filename}")
            print(f"  Table: {table_name}")
            print(f"  Size: {original_size:,} → {converted_size:,} bytes")
            
        except Exception as e:
            self.conversion_log.append({
                'file': mysql_filename,
                'error': str(e),
                'status': 'error'
            })
            print(f"✗ Error converting {mysql_filename}: {e}")
    
    def run_conversion(self):
        """Run the bulk conversion process"""
        print("MySQL to PostgreSQL Bulk Converter")
        print("=" * 50)
        
        # Find files to convert
        files_to_convert = self.find_mysql_files()
        
        if not files_to_convert:
            print("No files need conversion.")
            return
        
        print(f"Found {len(files_to_convert)} files to convert:")
        for filename in files_to_convert:
            print(f"  - {filename}")
        
        print("\nStarting conversion...")
        print("-" * 30)
        
        # Convert each file
        for filename in files_to_convert:
            self.convert_file(filename)
            print()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print conversion summary"""
        print("Conversion Summary")
        print("=" * 30)
        
        successful = [log for log in self.conversion_log if log['status'] == 'success']
        failed = [log for log in self.conversion_log if log['status'] == 'error']
        
        print(f"Total files processed: {len(self.conversion_log)}")
        print(f"Successful conversions: {len(successful)}")
        print(f"Failed conversions: {len(failed)}")
        
        if successful:
            print("\nSuccessful conversions:")
            for log in successful:
                print(f"  ✓ {log['file']} (Table: {log['table']})")
        
        if failed:
            print("\nFailed conversions:")
            for log in failed:
                print(f"  ✗ {log['file']}: {log['error']}")
        
        # Calculate total size conversion
        total_original = sum(log.get('original_size', 0) for log in successful)
        total_converted = sum(log.get('converted_size', 0) for log in successful)
        
        print(f"\nTotal data converted: {total_original:,} → {total_converted:,} bytes")

def main():
    # Set the database directory path
    database_dir = r"c:\Users\ken15.小恩\OneDrive\桌面\GURUlaptop\新增ckeditor版本(編輯中 render 用)\MFEE57-laptopGuru-ckeditor\frontend\data\database"
    
    # Create converter instance
    converter = MySQLToPostgreSQLConverter(database_dir)
    
    # Run conversion
    converter.run_conversion()

if __name__ == "__main__":
    main()
