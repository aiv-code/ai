"""Query validation utilities."""
import re
from typing import List, Set


# Dangerous SQL keywords that should not be allowed
DANGEROUS_KEYWORDS: Set[str] = {
    "DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE", "INSERT", "UPDATE",
    "GRANT", "REVOKE", "EXEC", "EXECUTE", "CALL", "MERGE", "REPLACE"
}

# Allowed SQL keywords for SELECT queries
ALLOWED_KEYWORDS: Set[str] = {
    "SELECT", "FROM", "WHERE", "JOIN", "INNER", "LEFT", "RIGHT", "FULL",
    "OUTER", "ON", "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET",
    "AS", "AND", "OR", "NOT", "IN", "LIKE", "ILIKE", "BETWEEN", "IS",
    "NULL", "DISTINCT", "COUNT", "SUM", "AVG", "MAX", "MIN", "CAST",
    "CASE", "WHEN", "THEN", "ELSE", "END", "UNION", "ALL", "EXCEPT",
    "INTERSECT", "WITH", "AS", "ASC", "DESC", "TOP", "FETCH", "NEXT"
}


def validate_sql_query(query: str) -> tuple[bool, str]:
    """
    Validate SQL query for safety.
    
    Returns:
        (is_valid, error_message)
    """
    query_upper = query.upper().strip()
    
    # Must start with SELECT
    if not query_upper.startswith("SELECT"):
        return False, "Only SELECT queries are allowed"
    
    # Check for dangerous keywords
    for keyword in DANGEROUS_KEYWORDS:
        # Use word boundaries to avoid false positives
        pattern = r'\b' + re.escape(keyword) + r'\b'
        if re.search(pattern, query_upper):
            return False, f"Dangerous keyword '{keyword}' is not allowed"
    
    # Check for semicolons (prevent multiple statements)
    if ';' in query:
        return False, "Multiple statements are not allowed"
    
    # Check for comments that might hide malicious code
    if '--' in query or '/*' in query:
        return False, "SQL comments are not allowed"
    
    return True, ""


def sanitize_sql_query(query: str) -> str:
    """
    Sanitize SQL query by removing extra whitespace and normalizing.
    
    Note: This does not prevent SQL injection. Always use parameterized queries.
    """
    # Remove extra whitespace
    query = ' '.join(query.split())
    
    # Remove trailing semicolons
    query = query.rstrip(';')
    
    return query.strip()


