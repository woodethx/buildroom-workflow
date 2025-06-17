import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Assignment,
  Person,
  LocalShipping,
  CheckCircle,
  Warning,
  FilterList,
} from '@mui/icons-material';
import PropTypes from 'prop-types';

// Mock services until actual services are created
const useAuth = () => ({ user: { id: 1, name: 'Test User' } });
const orderService = {
  getOrders: async () => {
    // Mock data
    return [
      {
        id: 1,
        woo_order_id: 'WC-1001',
        customer_name: 'John Doe',
        customer_department: 'Engineering',
        status: 'ordered',
        priority: 1,
        delivery_method: 'shipping',
        assigned_to: null,
        systems: [{ id: 1, status: 'pending' }],
        updated_at: new Date().toISOString()
      }
    ];
  },
  updateOrderStatus: async (orderId, status) => {
    console.log(`Updating order ${orderId} to status ${status}`);
    return { success: true };
  }
};

// Mock dialog component until created
const OrderDetailsDialog = ({ order, open, onClose, onUpdate }) => {
  return null; // Placeholder
};

OrderDetailsDialog.propTypes = {
  order: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
};

// Order card component with drag functionality
const OrderCard = ({ order, onOrderClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'order',
    item: { id: order.id, currentStatus: order.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const getPriorityColor = (priority) => {
    if (priority >= 3) return 'error';
    if (priority >= 2) return 'warning';
    return 'default';
  };

  const getSystemCount = () => {
    return order.systems?.filter(s => s.status !== 'complete').length || 0;
  };

  return (
    <Card
      ref={drag}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        mb: 2,
        '&:hover': { boxShadow: 3 },
        border: order.isAssignedToMe ? '2px solid #1976d2' : 'none',
      }}
      onClick={() => onOrderClick(order)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          <Typography variant="h6" component="div">
            #{order.woo_order_id}
          </Typography>
          {order.priority > 0 && (
            <Chip
              size="small"
              label={`P${order.priority}`}
              color={getPriorityColor(order.priority)}
            />
          )}
        </Box>
        
        <Typography color="text.secondary" gutterBottom>
          {order.customer_name}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          {order.customer_department}
        </Typography>

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Chip
            icon={<Assignment />}
            label={`${getSystemCount()} systems`}
            size="small"
            variant="outlined"
          />
          {order.delivery_method === 'shipping' ? (
            <LocalShipping fontSize="small" color="action" />
          ) : (
            <Person fontSize="small" color="action" />
          )}
        </Box>

        {order.assigned_to && (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 24, height: 24 }}>
              {order.assigned_to.first_name[0]}
            </Avatar>
            <Typography variant="caption">
              {order.assigned_to.first_name} {order.assigned_to.last_name}
            </Typography>
          </Box>
        )}

        {order.hasUrgentIssue && (
          <Chip
            icon={<Warning />}
            label="Needs Attention"
            color="error"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </CardContent>
    </Card>
  );
};

OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.number.isRequired,
    woo_order_id: PropTypes.string.isRequired,
    customer_name: PropTypes.string.isRequired,
    customer_department: PropTypes.string,
    status: PropTypes.string.isRequired,
    priority: PropTypes.number,
    delivery_method: PropTypes.string,
    systems: PropTypes.array,
    assigned_to: PropTypes.object,
    isAssignedToMe: PropTypes.bool,
    hasUrgentIssue: PropTypes.bool
  }).isRequired,
  onOrderClick: PropTypes.func.isRequired
};

// Column component with drop functionality
const KanbanColumn = ({ status, orders, onOrderDrop, onOrderClick }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'order',
    drop: (item) => {
      if (item.currentStatus !== status.value) {
        onOrderDrop(item.id, status.value);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const getColumnColor = () => {
    switch (status.value) {
      case 'ordered': return '#f5f5f5';
      case 'in_progress': return '#e3f2fd';
      case 'qa_review': return '#fff3e0';
      case 'ready_to_deliver': return '#f3e5f5';
      case 'complete': return '#e8f5e9';
      default: return '#f5f5f5';
    }
  };

  return (
    <Box
      ref={drop}
      sx={{
        flex: 1,
        minWidth: 300,
        backgroundColor: isOver ? '#e0e0e0' : getColumnColor(),
        borderRadius: 1,
        p: 2,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          {status.label}
        </Typography>
        <Chip label={orders.length} size="small" />
      </Box>
      
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onOrderClick={onOrderClick}
        />
      ))}
    </Box>
  );
};

KanbanColumn.propTypes = {
  status: PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  }).isRequired,
  orders: PropTypes.array.isRequired,
  onOrderDrop: PropTypes.func.isRequired,
  onOrderClick: PropTypes.func.isRequired
};

// Main Kanban Board component
const KanbanBoard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const statuses = [
    { value: 'ordered', label: 'Ordered' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'qa_review', label: 'QA Review' },
    { value: 'ready_to_deliver', label: 'Ready to Deliver' },
    { value: 'complete', label: 'Complete' },
  ];

  useEffect(() => {
    fetchOrders();
    // Set up real-time updates
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getOrders();
      const ordersWithFlags = data.map(order => ({
        ...order,
        isAssignedToMe: order.assigned_to?.id === user.id,
        hasUrgentIssue: checkUrgentIssues(order),
      }));
      setOrders(ordersWithFlags);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUrgentIssues = (order) => {
    // Check if order has been in current status too long
    const statusDuration = new Date() - new Date(order.updated_at);
    const maxDuration = 48 * 60 * 60 * 1000; // 48 hours
    return statusDuration > maxDuration && order.status !== 'complete';
  };

  const handleOrderDrop = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh the board
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const filteredOrders = orders.filter(order => {
    // Apply assignment filter
    if (filterMode === 'assigned' && !order.isAssignedToMe) return false;
    if (filterMode === 'unassigned' && order.assigned_to) return false;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.woo_order_id.toLowerCase().includes(searchLower) ||
        order.customer_name.toLowerCase().includes(searchLower) ||
        order.customer_department?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const getOrdersByStatus = (status) => {
    return filteredOrders.filter(order => order.status === status);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
        {/* Header with filters */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">Buildroom Workflow</Typography>
          
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 250 }}
            />
            
            <TextField
              select
              size="small"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              sx={{ width: 150 }}
              InputProps={{
                startAdornment: <FilterList sx={{ mr: 1 }} />,
              }}
            >
              <MenuItem value="all">All Orders</MenuItem>
              <MenuItem value="assigned">My Orders</MenuItem>
              <MenuItem value="unassigned">Unassigned</MenuItem>
            </TextField>
            
            <Button
              variant="contained"
              onClick={fetchOrders}
              startIcon={<CheckCircle />}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Kanban columns */}
        <Box
          display="flex"
          gap={2}
          sx={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
          {statuses.map((status) => (
            <KanbanColumn
              key={status.value}
              status={status}
              orders={getOrdersByStatus(status.value)}
              onOrderDrop={handleOrderDrop}
              onOrderClick={handleOrderClick}
            />
          ))}
        </Box>

        {/* Order details dialog */}
        <OrderDetailsDialog
          order={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={fetchOrders}
        />
      </Box>
    </DndProvider>
  );
};

export default KanbanBoard;