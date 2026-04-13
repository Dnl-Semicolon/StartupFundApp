import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { springPresets } from '@/lib/motion';

export interface Transaction {
  id: string;
  type: 'contribution' | 'withdrawal' | 'refund' | 'token_mint' | 'campaign_creation';
  amount: number;
  currency: 'ETH' | 'USDC';
  campaignId?: string;
  campaignTitle?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  txHash?: string;
  gasUsed?: number;
  blockNumber?: number;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function TransactionHistory({ transactions, isLoading = false }: TransactionHistoryProps) {
  const [filter, setFilter] = React.useState<string>('all');
  const [search, setSearch] = React.useState<string>('');

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(tx => {
      const matchesFilter = filter === 'all' || tx.type === filter;
      const matchesSearch = search === '' || 
        tx.campaignTitle?.toLowerCase().includes(search.toLowerCase()) ||
        tx.txHash?.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, search]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'contribution':
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case 'withdrawal':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'refund':
        return <ArrowDownLeft className="h-4 w-4 text-orange-500" />;
      case 'token_mint':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'campaign_creation':
        return <ArrowUpRight className="h-4 w-4 text-indigo-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const variants = {
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    
    return (
      <Badge variant="secondary" className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const formatTransactionType = (type: Transaction['type']) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="w-20 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={springPresets.gentle}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction History</span>
            <Badge variant="secondary" className="font-mono">
              {filteredTransactions.length} transactions
            </Badge>
          </CardTitle>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by campaign or transaction hash..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="contribution">Contributions</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
                <SelectItem value="token_mint">Token Mints</SelectItem>
                <SelectItem value="campaign_creation">Campaign Creation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                {search || filter !== 'all' 
                  ? "Try adjusting your search or filter criteria."
                  : "Your transaction history will appear here once you start using the platform."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx.type)}
                          <span className="font-medium text-sm">
                            {formatTransactionType(tx.type)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {tx.campaignTitle ? (
                          <div className="max-w-32 truncate font-medium text-sm">
                            {tx.campaignTitle}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-mono font-semibold">
                          {tx.amount} {tx.currency}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(tx.status)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div>{tx.timestamp.toLocaleDateString()}</div>
                          <div className="text-muted-foreground text-xs">
                            {tx.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {tx.txHash ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => window.open(`https://etherscan.io/tx/${tx.txHash}`, '_blank')}
                          >
                            <span className="font-mono text-xs">
                              {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                            </span>
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Transaction Summary Cards
 */
export function TransactionSummary({ transactions }: { transactions: Transaction[] }) {
  const summary = React.useMemo(() => {
    const totalContributed = transactions
      .filter(tx => tx.type === 'contribution' && tx.status === 'confirmed')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalWithdrawn = transactions
      .filter(tx => tx.type === 'withdrawal' && tx.status === 'confirmed')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalRefunded = transactions
      .filter(tx => tx.type === 'refund' && tx.status === 'confirmed')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const pendingTransactions = transactions.filter(tx => tx.status === 'pending').length;
    
    return {
      totalContributed,
      totalWithdrawn,
      totalRefunded,
      pendingTransactions
    };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Contributed</p>
              <p className="text-2xl font-bold font-mono">{summary.totalContributed.toFixed(3)} ETH</p>
            </div>
            <ArrowUpRight className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Withdrawn</p>
              <p className="text-2xl font-bold font-mono">{summary.totalWithdrawn.toFixed(3)} ETH</p>
            </div>
            <ArrowDownLeft className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Refunded</p>
              <p className="text-2xl font-bold font-mono">{summary.totalRefunded.toFixed(3)} ETH</p>
            </div>
            <ArrowDownLeft className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{summary.pendingTransactions}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}