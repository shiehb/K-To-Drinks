# apps/orders/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .serializers import OrderSerializer
from django.http import HttpResponse
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
from reportlab.lib.units import inch

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Order.objects.all()
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by store
        store_id = self.request.query_params.get('store_id')
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(created_at__date__range=[start_date, end_date])
        elif start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        elif end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # Limit results
        limit = self.request.query_params.get('limit')
        if limit:
            try:
                limit = int(limit)
                queryset = queryset[:limit]
            except ValueError:
                pass
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Get receipt data for an order."""
        order = self.get_object()
        
        # Prepare receipt data
        receipt_data = {
            'order_id': order.order_id,
            'date': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'store': {
                'name': order.store.name,
                'location': order.store.location,
                'contact': order.store.number
            },
            'items': [],
            'subtotal': 0,
            'tax': 0,
            'total': 0
        }
        
        # Add items
        for item in order.items.all():
            item_data = {
                'product': item.product.name,
                'size': item.product.size,
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'total': float(item.total_price)
            }
            receipt_data['items'].append(item_data)
            receipt_data['subtotal'] += item_data['total']
        
        # Calculate tax and total
        receipt_data['tax'] = round(receipt_data['subtotal'] * 0.02, 2)  # 2% tax
        receipt_data['total'] = receipt_data['subtotal'] + receipt_data['tax']
        
        return Response(receipt_data)
    
    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Generate PDF receipt for an order."""
        order = self.get_object()
        
        # Create a file-like buffer to receive PDF data
        buffer = io.BytesIO()
        
        # Create the PDF object, using the buffer as its "file"
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Set up the document
        p.setTitle(f"Order Receipt - {order.order_id}")
        
        # Add company header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(1 * inch, 10 * inch, "K-TO-DRINKS TRADING")
        
        p.setFont("Helvetica", 12)
        p.drawString(1 * inch, 9.7 * inch, "Order Receipt")
        
        # Add order details
        p.setFont("Helvetica-Bold", 12)
        p.drawString(1 * inch, 9.3 * inch, f"Order ID: {order.order_id}")
        p.setFont("Helvetica", 10)
        p.drawString(1 * inch, 9.0 * inch, f"Date: {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Add store details
        p.drawString(1 * inch, 8.6 * inch, f"Store: {order.store.name}")
        p.drawString(1 * inch, 8.3 * inch, f"Location: {order.store.location}")
        p.drawString(1 * inch, 8.0 * inch, f"Contact: {order.store.number}")
        
        # Add items table
        data = [["Product", "Size", "Quantity", "Unit Price", "Total"]]
        
        # Add item rows
        for item in order.items.all():
            data.append([
                item.product.name,
                item.product.size,
                str(item.quantity),
                f"₱{item.unit_price:.2f}",
                f"₱{item.total_price:.2f}"
            ])
        
        # Calculate totals
        subtotal = sum(item.total_price for item in order.items.all())
        tax = subtotal * 0.02  # 2% tax
        total = subtotal + tax
        
        # Add totals rows
        data.append(["", "", "", "Subtotal:", f"₱{subtotal:.2f}"])
        data.append(["", "", "", "Tax (2%):", f"₱{tax:.2f}"])
        data.append(["", "", "", "Total:", f"₱{total:.2f}"])
        
        # Create table
        table = Table(data, colWidths=[2*inch, 1*inch, 1*inch, 1*inch, 1*inch])
        
        # Add style to table
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -4), colors.white),
            ('BACKGROUND', (0, -3), (-1, -1), colors.lightgrey),
            ('FONTNAME', (3, -3), (-1, -1), 'Helvetica-Bold'),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -4), 1, colors.black),
            ('LINEBELOW', (3, -3), (-1, -1), 1, colors.black),
        ]))
        
        # Draw table
        table.wrapOn(p, letter[0] - 2*inch, letter[1])
        table.drawOn(p, 1*inch, 7*inch - len(data)*15)
        
        # Add footer
        p.setFont("Helvetica-Italic", 8)
        p.drawString(1*inch, 1*inch, "Thank you for your business!")
        p.drawString(1*inch, 0.8*inch, "K-TO-DRINKS TRADING")
        
        # Close the PDF object cleanly
        p.showPage()
        p.save()
        
        # Get the value of the BytesIO buffer and return response
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="order_{order.order_id}.pdf"'
        
        return response