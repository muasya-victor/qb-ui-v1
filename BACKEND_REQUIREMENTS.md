# Backend Requirements for Invoice UI Fixes

## Summary of Issues Fixed in Frontend:
1. ✅ **Currency Display**: Now uses company-specific currency from API response
2. ✅ **Real Data**: InvoiceManager now fetches from API instead of mock data
3. ✅ **Company Context**: Invoices are filtered by active company
4. ✅ **Sync Error Handling**: Better error messages and feedback
5. ✅ **Session Support**: All API calls include `credentials: 'include'`

## Required Backend Changes:

### 1. Invoice API Endpoints Updates

#### **GET /api/invoices/**
**Current**: Returns basic invoice data (possibly paginated incorrectly)
**Required**: Must include company currency, filter by active company, and support efficient pagination

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)
- `search`: Search query for invoice/customer names
- `status`: Filter by payment status (paid/unpaid)
- `fetch_all`: Boolean to indicate fetching all pages (used by frontend)

```python
# Expected Response Format (Paginated):
{
    "success": true,
    "invoices": [
        {
            "id": "qb_invoice_123",
            "doc_number": "INV-001",
            "total_amt": 1500.00,
            "balance": 750.00,
            "txn_date": "2024-01-15",
            "due_date": "2024-02-15",
            "customer_name": "Acme Corp",
            "status": "sent",
            "currency_code": "USD"  # Individual currency if different
        }
    ],
    "pagination": {  # NEW: Pagination metadata
        "count": 250,           # Total number of invoices
        "next": "http://api/invoices/?page=3",
        "previous": "http://api/invoices/?page=1",
        "page_size": 100,
        "current_page": 2,
        "total_pages": 3
    },
    "company_info": {  # Company context
        "currency_code": "USD",
        "name": "My Company LLC",
        "realm_id": "123456789"
    }
}
```

**Implementation Requirements:**
- Must filter invoices by user's **active company**
- Include company's **default currency** in response
- Handle **multiple companies** per user
- Use **JWT authentication** + **session** for active company context
- **Support large datasets**: Companies may have thousands of invoices from QuickBooks
- **Efficient pagination**: Large page sizes (up to 100) for bulk loading
- **Database optimization**: Proper indexing on company_id, txn_date for performance

### QuickBooks Pagination Considerations:

QuickBooks companies often have hundreds or thousands of invoices. The frontend now:
1. **Fetches ALL invoices** by iterating through all pages
2. **Shows progress** during multi-page loading
3. **Displays all data** in a single table with client-side filtering

**Backend Implementation Example:**
```python
# Django view example
def get_invoices(request):
    page = int(request.GET.get('page', 1))
    page_size = min(int(request.GET.get('page_size', 20)), 100)

    active_company = get_active_company(request.user)
    if not active_company:
        return error_response("No active company selected")

    # Filter by company and apply pagination
    invoices_qs = Invoice.objects.filter(
        company=active_company
    ).order_by('-txn_date')  # Most recent first

    paginator = Paginator(invoices_qs, page_size)
    page_obj = paginator.get_page(page)

    return {
        "success": True,
        "invoices": serialize_invoices(page_obj.object_list),
        "pagination": {
            "count": paginator.count,
            "next": page_obj.next_page_number() if page_obj.has_next() else None,
            "previous": page_obj.previous_page_number() if page_obj.has_previous() else None,
            "page_size": page_size,
            "current_page": page,
            "total_pages": paginator.num_pages
        },
        "company_info": {
            "currency_code": active_company.currency_code,
            "name": active_company.name,
            "realm_id": active_company.realm_id
        }
    }
```

#### **POST /api/invoices/sync_from_quickbooks/**
**Current**: May not include proper company context
**Required**: Must sync for active company only

```python
# Expected Response Format:
{
    "success": true,
    "message": "Successfully synced invoices for Acme Corp",
    "synced_count": 15,
    "company_info": {
        "name": "Acme Corp",
        "realm_id": "123456789"
    }
}

# Error Response Format:
{
    "success": false,
    "error": "No active company selected",
    "message": "Please select a company first"
}
```

**Implementation Requirements:**
- Identify **active company** from user session/JWT
- Sync only for that company's **realm_id**
- Return **specific error messages** for debugging
- Include **count** of synced invoices

### 2. Session Management for OAuth State

**Required**: Implement session support for CSRF state validation

```python
# Django settings.py
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_COOKIE_AGE = 600  # 10 minutes for OAuth
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CORS_ALLOW_CREDENTIALS = True

# CORS settings for frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3001",  # Frontend dev server
]
```

### 3. Enhanced Error Responses

All endpoints should return consistent error format:

```python
# Error Response Format:
{
    "success": false,
    "error": "Specific error message",
    "detail": "Additional details for debugging",
    "code": "ERROR_CODE_FOR_CLIENT"
}
```

### 4. Company Context in Invoice Operations

```python
# Pseudo-code for invoice endpoints:

def get_invoices(request):
    user = request.user  # From JWT
    active_company = get_active_company(user)  # From session or DB

    if not active_company:
        return error_response("No active company selected")

    # Filter invoices by company
    invoices = Invoice.objects.filter(
        company__realm_id=active_company.realm_id
    )

    return {
        "success": True,
        "invoices": serialize_invoices(invoices),
        "company_info": {
            "currency_code": active_company.currency_code,
            "name": active_company.name,
            "realm_id": active_company.realm_id
        }
    }

def sync_invoices(request):
    user = request.user
    active_company = get_active_company(user)

    if not active_company:
        return error_response("No active company selected")

    if not active_company.is_connected:
        return error_response("Company is not connected to QuickBooks")

    # Sync from QuickBooks for this company only
    synced_count = sync_from_quickbooks(active_company.realm_id)

    return {
        "success": True,
        "message": f"Successfully synced invoices for {active_company.name}",
        "synced_count": synced_count
    }
```

### 5. Currency Support

Ensure company model includes currency information:

```python
# Company model should have:
class Company(models.Model):
    name = models.CharField(max_length=255)
    realm_id = models.CharField(max_length=50)
    currency_code = models.CharField(max_length=3, default='USD')  # NEW
    is_connected = models.BooleanField(default=True)
    # ... other fields

# When connecting via OAuth, fetch and store currency:
def oauth_callback(request):
    # After successful QB connection:
    company_info = fetch_company_info_from_qb(realm_id)

    company.currency_code = company_info.get('currency', 'USD')
    company.save()
```

## Testing the Fixes:

1. **Currency Display**: Should show proper currency symbols (€, £, ¥, etc.)
2. **Real Data**: Invoice table should show actual QuickBooks data
3. **Company Filtering**: Switching companies should show different invoices
4. **Sync Function**: Should work without errors and show sync count
5. **Error Handling**: Clear error messages when things go wrong

## Frontend Changes Completed ✅:

- ✅ Currency formatting with `Intl.NumberFormat`
- ✅ Real API data instead of mock data
- ✅ Company context throughout invoice flow
- ✅ Enhanced error handling with user feedback
- ✅ Session cookie support in all API calls
- ✅ Proper TypeScript interfaces for API responses
- ✅ Loading states and error recovery
- ✅ Sync button with progress indicator

The frontend is now ready to work with the updated backend API!