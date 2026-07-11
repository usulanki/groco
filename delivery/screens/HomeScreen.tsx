import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { api } from '../utils/api';
import {
  clearAuth,
  clearActiveOrderId,
  getActiveOrderId,
  getAuthToken,
  getStoredAgent,
  setActiveOrderId,
  type StoredAgent,
} from '../utils/auth';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function openMaps(address: string) {
  const q = encodeURIComponent(address);
  Linking.openURL(`https://maps.google.com/?q=${q}`).catch(() => {});
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActiveOrder {
  id: number;
  order_no: string;
  total: number;
  payment_mode: string;
  order_status: string;
  created_ts: string;
  Outlet?: { id: number; name: string; address1?: string; city?: string };
}

interface OrderDetail {
  id: number;
  order_no: string;
  order_status: string;
  total: number;
  order_amount: number;
  discount_amount: number;
  delivery_charge: number;
  tax: number;
  payment_mode: string;
  notes: string | null;
  created_ts: string;
  Outlet?: {
    id: number;
    name: string;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  };
  User?: {
    id: number;
    fname: string;
    lname: string;
    phone?: string | null;
  };
  Address?: {
    id: number;
    address1: string;
    address2?: string | null;
    pincode: string;
  } | null;
  OrderItems?: Array<{
    id: number;
    quantity: number;
    price: number;
    total: number;
    Product?: { id: number; name: string } | null;
  }>;
}

interface NearbyOutlet {
  id: number;
  name: string;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  serviceable_distance_km: number;
  instant_delivery_enabled: boolean;
  distance_km: number | null;
}

interface DeliveredOrder {
  id: number;
  order_no: string;
  total: number;
  delivery_charge: number;
  payment_mode: string;
  created_ts: string;
  updated_ts: string;
  Outlet?: { id: number; name: string };
  User?: { id: number; fname: string; lname: string; phone?: string | null };
}

type OrderFilter = 'today' | 'week' | 'month' | 'custom';

function getFilterRange(filter: OrderFilter): { from: string; to: string } | null {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  if (filter === 'today') {
    return { from: fmt(now), to: fmt(now) };
  }
  if (filter === 'week') {
    const start = new Date(now);
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)); // Monday start
    return { from: fmt(start), to: fmt(now) };
  }
  if (filter === 'month') {
    return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(now) };
  }
  return null;
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'home' | 'orders' | 'wallet' | 'profile';

// ── Bottom tab bar ────────────────────────────────────────────────────────────

const TAB_ITEMS: { key: Tab; label: string; icon: string; activeIcon: string }[] = [
  { key: 'home',    label: 'Home',    icon: 'home-outline',    activeIcon: 'home'    },
  { key: 'orders',  label: 'Orders',  icon: 'receipt-outline', activeIcon: 'receipt' },
  { key: 'wallet',  label: 'Wallet',  icon: 'wallet-outline',  activeIcon: 'wallet'  },
  { key: 'profile', label: 'Profile', icon: 'person-outline',  activeIcon: 'person'  },
];

function BottomTabBar({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[tb.bar, { paddingBottom: bottom || 10 }]}>
      {TAB_ITEMS.map(({ key, label, icon, activeIcon }) => {
        const isActive = active === key;
        return (
          <Pressable key={key} style={tb.item} onPress={() => onSelect(key)}>
            <Ionicons
              name={(isActive ? activeIcon : icon) as any}
              size={22}
              color={isActive ? '#ffcc01' : '#9ca3af'}
            />
            <Text style={[tb.label, isActive && tb.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Placeholder tab screens ────────────────────────────────────────────────────

const FILTER_TABS: { key: OrderFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

function OrdersTab() {
  const [filter,        setFilter]        = useState<OrderFilter>('today');
  const [orders,        setOrders]        = useState<DeliveredOrder[] | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [customFromDate, setCustomFromDate] = useState(new Date());
  const [customToDate,   setCustomToDate]   = useState(new Date());
  const [activePicker,   setActivePicker]   = useState<'from' | 'to' | null>(null);
  const [customReady,   setCustomReady]   = useState(false);

  const fetchDelivered = useCallback(async (from: string, to: string) => {
    const token = await getAuthToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<DeliveredOrder[]>(
        `/api/delivery/orders/delivered?from=${from}&to=${to}`,
        token,
      );
      setOrders(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const range = getFilterRange(filter);
    if (range) fetchDelivered(range.from, range.to);
    else setOrders(null);
  }, [filter, fetchDelivered]);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const fmtDisplay = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const handlePickerChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (!selected) return;
    if (activePicker === 'from') setCustomFromDate(selected);
    else if (activePicker === 'to') setCustomToDate(selected);
  };

  const applyCustom = () => {
    setCustomReady(true);
    fetchDelivered(fmt(customFromDate), fmt(customToDate));
  };

  const totalFee = (orders ?? []).reduce((s, o) => s + Number(o.delivery_charge ?? 0), 0);
  const totalAmt = (orders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Filter strip */}
      <View style={ot.filterBar}>
        {FILTER_TABS.map(f => (
          <Pressable
            key={f.key}
            style={[ot.chip, filter === f.key && ot.chipActive]}
            onPress={() => { setFilter(f.key); if (f.key !== 'custom') setCustomReady(false); }}
          >
            <Text style={[ot.chipLabel, filter === f.key && ot.chipLabelActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Custom date pickers */}
      {filter === 'custom' && (
        <View style={ot.customBox}>
          <View style={ot.customRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={ot.customLabel}>From</Text>
              <Pressable style={ot.datePressable} onPress={() => setActivePicker('from')}>
                <Ionicons name="calendar-outline" size={15} color="#6b7280" />
                <Text style={ot.dateText}>{fmtDisplay(customFromDate)}</Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ot.customLabel}>To</Text>
              <Pressable style={ot.datePressable} onPress={() => setActivePicker('to')}>
                <Ionicons name="calendar-outline" size={15} color="#6b7280" />
                <Text style={ot.dateText}>{fmtDisplay(customToDate)}</Text>
              </Pressable>
            </View>
          </View>
          <Pressable style={ot.applyBtn} onPress={applyCustom}>
            <Text style={ot.applyBtnText}>Apply</Text>
          </Pressable>

          {/* Android: renders as native dialog */}
          {Platform.OS === 'android' && activePicker !== null && (
            <DateTimePicker
              value={activePicker === 'from' ? customFromDate : customToDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              minimumDate={activePicker === 'to' ? customFromDate : undefined}
              onChange={handlePickerChange}
            />
          )}
        </View>
      )}

      {/* iOS date picker bottom sheet */}
      {Platform.OS === 'ios' && filter === 'custom' && (
        <Modal visible={activePicker !== null} transparent animationType="slide">
          <View style={ot.pickerOverlay}>
            <View style={ot.pickerSheet}>
              <View style={ot.pickerHeader}>
                <Text style={ot.pickerTitle}>
                  {activePicker === 'from' ? 'From Date' : 'To Date'}
                </Text>
                <Pressable onPress={() => setActivePicker(null)}>
                  <Text style={ot.pickerDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={activePicker === 'from' ? customFromDate : customToDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                minimumDate={activePicker === 'to' ? customFromDate : undefined}
                onChange={handlePickerChange}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Summary bar */}
      {orders !== null && !loading && (
        <View style={ot.summaryCard}>
          <View style={ot.summaryItem}>
            <Text style={ot.summaryVal}>{orders.length}</Text>
            <Text style={ot.summaryLabel}>Delivered</Text>
          </View>
          <View style={ot.summaryDivider} />
          <View style={ot.summaryItem}>
            <Text style={ot.summaryVal}>₹{totalFee.toFixed(2)}</Text>
            <Text style={ot.summaryLabel}>Del. Fees</Text>
          </View>
          <View style={ot.summaryDivider} />
          <View style={ot.summaryItem}>
            <Text style={ot.summaryVal}>₹{totalAmt.toFixed(2)}</Text>
            <Text style={ot.summaryLabel}>Order Value</Text>
          </View>
        </View>
      )}

      {/* List */}
      <ScrollView contentContainerStyle={ot.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 48 }}>
            <ActivityIndicator size="large" color="#ffcc01" />
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', padding: 32 }}>
            <Ionicons name="alert-circle-outline" size={36} color="#f87171" />
            <Text style={{ marginTop: 12, fontSize: 14, color: '#f87171', textAlign: 'center' }}>{error}</Text>
          </View>
        ) : filter === 'custom' && !customReady ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Ionicons name="calendar-outline" size={44} color="#d1d5db" />
            <Text style={{ marginTop: 16, fontSize: 14, color: '#aaa', textAlign: 'center' }}>
              Choose a date range above and tap Apply
            </Text>
          </View>
        ) : orders !== null && orders.length === 0 ? (
          <View style={s.emptyBox}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={36} color="#aaa" />
            </View>
            <Text style={s.emptyTitle}>No deliveries</Text>
            <Text style={s.emptyDesc}>No orders delivered in this period.</Text>
          </View>
        ) : (orders ?? []).map(order => (
          <View key={order.id} style={ot.orderCard}>
            <View style={ot.cardHeader}>
              <Text style={ot.orderNo}>{order.order_no}</Text>
              <View style={ot.deliveredBadge}>
                <Text style={ot.deliveredBadgeText}>DELIVERED</Text>
              </View>
            </View>

            {order.Outlet && (
              <Text style={ot.outletName} numberOfLines={1}>{order.Outlet.name}</Text>
            )}
            {order.User && (
              <Text style={ot.customerName} numberOfLines={1}>
                {order.User.fname} {order.User.lname}
                {order.User.phone ? ` · ${order.User.phone}` : ''}
              </Text>
            )}

            <View style={ot.amtRow}>
              <View>
                <Text style={ot.amtLabel}>Order Total</Text>
                <Text style={ot.amtVal}>₹{Number(order.total).toFixed(2)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={ot.amtLabel}>Delivery Fee</Text>
                <Text style={[ot.amtVal, { color: '#ffcc01' }]}>
                  ₹{Number(order.delivery_charge).toFixed(2)}
                </Text>
              </View>
            </View>

            <Text style={ot.orderTime}>{timeAgo(order.updated_ts)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

interface WalletSummary {
  total_earned: number;
  total_paid_out: number;
  available_balance: number;
}

interface PayoutRecord {
  id: number;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  notes: string | null;
  created_ts: string;
}

function WalletTab() {
  const [summary,        setSummary]        = useState<WalletSummary | null>(null);
  const [payouts,        setPayouts]        = useState<PayoutRecord[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [menuVisible,    setMenuVisible]    = useState(false);
  const [modalVisible,   setModalVisible]   = useState(false);
  const [payoutAmt,      setPayoutAmt]      = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);

  const load = useCallback(async (quiet = false) => {
    const token = await getAuthToken();
    if (!token) return;
    if (!quiet) setLoading(true);
    try {
      const [sum, list] = await Promise.all([
        api.get<WalletSummary>('/api/delivery/wallet/summary', token),
        api.get<PayoutRecord[]>('/api/delivery/wallet/payouts', token),
      ]);
      setSummary(sum);
      setPayouts(list ?? []);
    } catch {
      // silent — show stale data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openPayoutModal = () => {
    setMenuVisible(false);
    setPayoutAmt(summary ? String(summary.available_balance) : '');
    setModalVisible(true);
  };

  const MIN_PAYOUT = 300;
  const canPayout  = (summary?.available_balance ?? 0) >= MIN_PAYOUT;

  const submitPayout = async () => {
    const amount = Number(payoutAmt);
    if (!amount || amount < MIN_PAYOUT) {
      Alert.alert('Minimum payout', `Minimum payout amount is ₹${MIN_PAYOUT}.`);
      return;
    }
    if (summary && amount > summary.available_balance) {
      Alert.alert('Insufficient balance', `Available balance is ₹${summary.available_balance.toFixed(2)}.`);
      return;
    }
    const token = await getAuthToken();
    if (!token) return;
    setSubmitting(true);
    try {
      await api.post('/api/delivery/wallet/payout', { amount }, { Authorization: `Bearer ${token}` });
      setModalVisible(false);
      load(true);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit payout request.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s: PayoutRecord['status']) =>
    s === 'completed' ? '#16a34a' : s === 'rejected' ? '#ef4444' : '#f59e0b';

  const statusLabel = (s: PayoutRecord['status']) =>
    s === 'completed' ? 'Completed' : s === 'rejected' ? 'Rejected' : 'Pending';

  if (loading) {
    return (
      <View style={[ph.wrap, { backgroundColor: '#f5f5f5' }]}>
        <ActivityIndicator size="large" color="#ffcc01" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f5f5f5' }}
      contentContainerStyle={wt.scroll}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(true); }}
    >
      {/* Earnings card */}
      <View style={wt.card}>
        <View style={wt.cardHeader}>
          <View style={wt.cardIconWrap}>
            <Ionicons name="wallet-outline" size={20} color="#ffcc01" />
          </View>
          <Text style={wt.cardTitle}>My Wallet</Text>
          <Pressable style={wt.dotsBtn} onPress={() => setMenuVisible(v => !v)} hitSlop={12}>
            <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
          </Pressable>
          {menuVisible && (
            <>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} />
              <View style={wt.menu}>
              <Pressable
                style={[wt.menuItem, canPayout ? null : wt.menuItemDisabled]}
                onPress={canPayout ? openPayoutModal : undefined}
              >
                <Ionicons name="arrow-up-circle-outline" size={16} color={canPayout ? '#1a1a1a' : '#c4c4c4'} style={{ marginRight: 8 }} />
                <Text style={[wt.menuItemText, canPayout ? null : wt.menuItemTextDisabled]}>Request Payout</Text>
              </Pressable>
              </View>
            </>
          )}
        </View>

        <View style={wt.balanceRow}>
          <Text style={wt.balanceLabel}>Available Balance</Text>
          <Text style={wt.balanceAmt}>₹{(summary?.available_balance ?? 0).toFixed(2)}</Text>
          {!canPayout && (
            <Text style={wt.minPayoutHint}>Minimum ₹{MIN_PAYOUT} required for payout</Text>
          )}
        </View>

        <View style={wt.divider} />

        <View style={wt.statsRow}>
          <View style={wt.statItem}>
            <Text style={wt.statVal}>₹{(summary?.total_earned ?? 0).toFixed(2)}</Text>
            <Text style={wt.statLabel}>Total Earned</Text>
          </View>
          <View style={wt.statDivider} />
          <View style={wt.statItem}>
            <Text style={wt.statVal}>₹{(summary?.total_paid_out ?? 0).toFixed(2)}</Text>
            <Text style={wt.statLabel}>Paid Out</Text>
          </View>
        </View>
      </View>

      {/* Payout history */}
      <Text style={wt.sectionTitle}>Payout History</Text>

      {payouts.length === 0 ? (
        <View style={wt.emptyBox}>
          <Ionicons name="receipt-outline" size={32} color="#d1d5db" />
          <Text style={wt.emptyText}>No payout requests yet.</Text>
        </View>
      ) : (
        payouts.map(p => (
          <View key={p.id} style={wt.payoutRow}>
            <View style={wt.payoutLeft}>
              <Text style={wt.payoutAmt}>₹{Number(p.amount).toFixed(2)}</Text>
              <Text style={wt.payoutDate}>{new Date(p.created_ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            </View>
            <View style={[wt.statusBadge, { backgroundColor: statusColor(p.status) + '20' }]}>
              <Text style={[wt.statusText, { color: statusColor(p.status) }]}>{statusLabel(p.status)}</Text>
            </View>
          </View>
        ))
      )}

      {/* Payout request modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={wt.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <Pressable style={wt.modalSheet} onPress={() => {}}>
            <Text style={wt.modalTitle}>Request Payout</Text>
            <Text style={wt.modalSub}>
              Available: ₹{(summary?.available_balance ?? 0).toFixed(2)} · Min. payout ₹{MIN_PAYOUT}
            </Text>
            <View style={wt.amtRow}>
              <Text style={wt.amtPrefix}>₹</Text>
              <TextInput
                style={wt.amtInput}
                value={payoutAmt}
                onChangeText={setPayoutAmt}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#bbb"
                autoFocus
              />
            </View>
            <Pressable
              style={[wt.confirmBtn, submitting && { opacity: 0.6 }]}
              onPress={submitPayout}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#1a1a1a" />
                : <Text style={wt.confirmBtnText}>Submit Request</Text>}
            </Pressable>
            <Pressable style={wt.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={wt.cancelBtnText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

function ProfileTab({ agent, onLogout }: { agent: StoredAgent | null; onLogout: () => void }) {
  const initials = agent
    ? `${agent.first_name?.[0] ?? ''}${agent.last_name?.[0] ?? ''}`.toUpperCase()
    : 'G';
  const fullName = agent ? `${agent.first_name ?? ''} ${agent.last_name ?? ''}`.trim() : '—';

  const [pwdModal,     setPwdModal]     = useState(false);
  const [currentPwd,   setCurrentPwd]   = useState('');
  const [newPwd,       setNewPwd]       = useState('');
  const [confirmPwd,   setConfirmPwd]   = useState('');
  const [pwdLoading,   setPwdLoading]   = useState(false);
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const openPwdModal = () => {
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    setShowCurrent(false); setShowNew(false); setShowConfirm(false);
    setPwdModal(true);
  };

  const submitChangePassword = async () => {
    if (!currentPwd.trim() || !newPwd.trim() || !confirmPwd.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (newPwd.length < 8) {
      Alert.alert('Too short', 'New password must be at least 8 characters.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Mismatch', 'New password and confirm password do not match.');
      return;
    }
    const token = await getAuthToken();
    if (!token) return;
    setPwdLoading(true);
    try {
      await api.post(
        '/api/delivery/auth/change-password',
        { current_password: currentPwd.trim(), new_password: newPwd },
        { Authorization: `Bearer ${token}` },
      );
      setPwdModal(false);
      Alert.alert('Success', 'Password changed successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={ph.profileScroll} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <View style={ph.avatarWrap}>
        <View style={ph.avatar}>
          <Text style={ph.avatarText}>{initials}</Text>
        </View>
        <Text style={ph.profileName}>{fullName || '—'}</Text>
        {agent?.email && <Text style={ph.profileSub}>{agent.email}</Text>}
      </View>

      {/* Info rows */}
      <View style={ph.infoCard}>
        {agent?.mobile ? (
          <View style={ph.infoRow}>
            <Ionicons name="call-outline" size={18} color="#6b7280" style={ph.infoIcon} />
            <Text style={ph.infoValue}>{agent.mobile}</Text>
          </View>
        ) : null}
        {agent?.email ? (
          <View style={[ph.infoRow, { borderTopWidth: agent?.mobile ? 1 : 0, borderTopColor: '#f3f4f6' }]}>
            <Ionicons name="mail-outline" size={18} color="#6b7280" style={ph.infoIcon} />
            <Text style={ph.infoValue}>{agent.email}</Text>
          </View>
        ) : null}
      </View>

      {/* Change password */}
      <Pressable style={ph.actionBtn} onPress={openPwdModal}>
        <Ionicons name="lock-closed-outline" size={18} color="#6b7280" style={{ marginRight: 12 }} />
        <Text style={ph.actionBtnText}>Change Password</Text>
        <Ionicons name="chevron-forward" size={16} color="#c4c4c4" style={{ marginLeft: 'auto' }} />
      </Pressable>

      {/* Logout */}
      <Pressable style={ph.logoutBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
        <Text style={ph.logoutText}>Logout</Text>
      </Pressable>

      {/* Change password modal */}
      <Modal visible={pwdModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={ph.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPwdModal(false)} />
          <View style={ph.modalSheet}>
            <Text style={ph.modalTitle}>Change Password</Text>

            {/* Current password */}
            <Text style={ph.fieldLabel}>Current Password</Text>
            <View style={ph.fieldRow}>
              <TextInput
                style={ph.fieldInput}
                value={currentPwd}
                onChangeText={setCurrentPwd}
                secureTextEntry={!showCurrent}
                placeholder="Enter current password"
                placeholderTextColor="#bbb"
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowCurrent(v => !v)} hitSlop={10}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </Pressable>
            </View>

            {/* New password */}
            <Text style={ph.fieldLabel}>New Password</Text>
            <View style={ph.fieldRow}>
              <TextInput
                style={ph.fieldInput}
                value={newPwd}
                onChangeText={setNewPwd}
                secureTextEntry={!showNew}
                placeholder="Min. 8 characters"
                placeholderTextColor="#bbb"
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowNew(v => !v)} hitSlop={10}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </Pressable>
            </View>

            {/* Confirm password */}
            <Text style={ph.fieldLabel}>Confirm New Password</Text>
            <View style={ph.fieldRow}>
              <TextInput
                style={ph.fieldInput}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry={!showConfirm}
                placeholder="Re-enter new password"
                placeholderTextColor="#bbb"
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowConfirm(v => !v)} hitSlop={10}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </Pressable>
            </View>

            <Pressable
              style={[ph.submitBtn, pwdLoading && { opacity: 0.6 }]}
              onPress={submitChangePassword}
              disabled={pwdLoading}
            >
              {pwdLoading
                ? <ActivityIndicator size="small" color="#1a1a1a" />
                : <Text style={ph.submitBtnText}>Update Password</Text>}
            </Pressable>
            <Pressable style={ph.cancelBtn} onPress={() => setPwdModal(false)}>
              <Text style={ph.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatItem({ label, value, accent, borderRight }: {
  label: string; value: string; accent?: boolean; borderRight?: boolean;
}) {
  return (
    <View style={[s.statWrap, borderRight && s.statBorder]}>
      <Text style={[s.statVal, accent && s.statAccent]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function OrderCard({
  order, onView,
}: {
  order: ActiveOrder;
  onView: (id: number) => void;
}) {
  const modeColor: Record<string, string> = {
    cod: '#f59e0b', online: '#3b82f6', upi: '#8b5cf6',
    wallet: '#10b981', card: '#ec4899',
  };
  const color = modeColor[order.payment_mode] ?? '#888';

  return (
    <View style={s.orderCard}>
      <View style={s.orderRow}>
        <Text style={s.orderNo}>{order.order_no}</Text>
        <View style={[s.modeBadge, { backgroundColor: color + '20' }]}>
          <Text style={[s.modeText, { color }]}>{order.payment_mode.toUpperCase()}</Text>
        </View>
      </View>
      {order.Outlet && (
        <Text style={s.outletName} numberOfLines={1}>
          {order.Outlet.name}{order.Outlet.city ? ` · ${order.Outlet.city}` : ''}
        </Text>
      )}
      <View style={s.orderRow}>
        <Text style={s.orderAmount}>₹ {Number(order.total).toFixed(2)}</Text>
        <Text style={s.orderTime}>{timeAgo(order.created_ts)}</Text>
      </View>
      <Pressable
        style={s.viewBtn}
        onPress={() => onView(order.id)}
      >
        <Ionicons name="receipt-outline" size={16} color="#1a1a1a" style={{ marginRight: 6 }} />
        <Text style={s.viewBtnText}>View Order</Text>
        <Ionicons name="chevron-forward" size={16} color="#1a1a1a" style={{ marginLeft: 4 }} />
      </Pressable>
    </View>
  );
}

function OutletCard({ outlet }: { outlet: NearbyOutlet }) {
  const distLabel = outlet.distance_km != null
    ? outlet.distance_km < 1
      ? `${Math.round(outlet.distance_km * 1000)} m away`
      : `${outlet.distance_km.toFixed(1)} km away`
    : null;

  return (
    <View style={s.outletCard}>
      <View style={s.outletCardRow}>
        <View style={s.outletIconWrap}>
          <Ionicons name="storefront-outline" size={20} color="#16a34a" />
        </View>
        <View style={s.outletCardInfo}>
          <Text style={s.outletCardName} numberOfLines={1}>{outlet.name}</Text>
          {(outlet.address1 || outlet.city) && (
            <Text style={s.outletCardAddr} numberOfLines={1}>
              {[outlet.address1, outlet.city].filter(Boolean).join(', ')}
            </Text>
          )}
        </View>
        {distLabel && <Text style={s.outletCardDist}>{distLabel}</Text>}
      </View>
      <View style={s.outletCardFooter}>
        <View style={s.radiusPill}>
          <Ionicons name="radio-outline" size={12} color="#888" style={{ marginRight: 4 }} />
          <Text style={s.radiusText}>{outlet.serviceable_distance_km} km radius</Text>
        </View>
        {outlet.instant_delivery_enabled && (
          <View style={s.instantPill}>
            <Ionicons name="flash-outline" size={12} color="#f59e0b" style={{ marginRight: 3 }} />
            <Text style={s.instantText}>Instant</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function LocationDenied({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={s.permWrap}>
      <Text style={s.permIcon}>📍</Text>
      <Text style={s.permTitle}>Location access needed</Text>
      <Text style={s.permDesc}>
        groco Delivery needs your location to find active orders near you.
        Please allow location access to continue.
      </Text>
      <Pressable style={s.permBtn} onPress={onRetry}>
        <Text style={s.permBtnText}>Allow location</Text>
      </Pressable>
    </View>
  );
}

// ── Order detail modal ────────────────────────────────────────────────────────

function OrderDetailModal({
  order, accepting, onAccept, onClose,
}: {
  order: OrderDetail;
  accepting: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const isCod = order.payment_mode === 'cod';
  const outletAddr = [order.Outlet?.address1, order.Outlet?.address2, order.Outlet?.city, order.Outlet?.state]
    .filter(Boolean).join(', ');
  const deliveryAddr = [order.Address?.address1, order.Address?.address2, order.Address?.pincode]
    .filter(Boolean).join(', ');

  return (
    <Modal animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={s.modalOverlay}>
        <SafeAreaView style={s.modalSheet}>

          {/* Header */}
          <View style={s.modalHeader}>
            <Pressable style={s.modalCloseBtn} onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#1a1a1a" />
            </Pressable>
            <Text style={s.modalTitle}>Order Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={s.modalScroll} showsVerticalScrollIndicator={false}>

            {/* Order identity */}
            <View style={s.modalOrderBadge}>
              <Text style={s.modalOrderNo}>{order.order_no}</Text>
              <Text style={s.modalOrderTime}>{timeAgo(order.created_ts)}</Text>
            </View>

            {/* Pick up from */}
            <View style={s.deliverySection}>
              <View style={s.deliverySectionHeader}>
                <View style={[s.deliveryIconCircle, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="storefront-outline" size={18} color="#16a34a" />
                </View>
                <Text style={s.deliverySectionTitle}>Pick up from</Text>
              </View>
              <View style={s.deliverySectionBody}>
                <Text style={s.deliveryName}>{order.Outlet?.name ?? '—'}</Text>
                {outletAddr ? <Text style={s.deliveryAddr}>{outletAddr}</Text> : null}
                {order.Outlet?.pincode ? (
                  <Text style={s.deliveryPincode}>Pincode: {order.Outlet.pincode}</Text>
                ) : null}
              </View>
            </View>

            {/* Deliver to */}
            <View style={s.deliverySection}>
              <View style={s.deliverySectionHeader}>
                <View style={[s.deliveryIconCircle, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="person-outline" size={18} color="#3b82f6" />
                </View>
                <Text style={s.deliverySectionTitle}>Deliver to</Text>
              </View>
              <View style={s.deliverySectionBody}>
                <Text style={s.deliveryName}>
                  {order.User ? `${order.User.fname} ${order.User.lname}` : '—'}
                </Text>
                {order.User?.phone ? (
                  <Text style={s.deliveryPhone}>
                    <Ionicons name="call-outline" size={12} color="#888" /> {order.User.phone}
                  </Text>
                ) : null}
                {deliveryAddr
                  ? <Text style={s.deliveryAddr}>{deliveryAddr}</Text>
                  : <Text style={s.deliveryAddr}>No delivery address on file</Text>
                }
              </View>
            </View>

            {/* Items */}
            {order.OrderItems && order.OrderItems.length > 0 && (
              <View style={s.deliverySection}>
                <View style={s.deliverySectionHeader}>
                  <View style={[s.deliveryIconCircle, { backgroundColor: '#fefce8' }]}>
                    <Ionicons name="bag-outline" size={18} color="#ca8a04" />
                  </View>
                  <Text style={s.deliverySectionTitle}>Items ({order.OrderItems.length})</Text>
                </View>
                <View style={s.itemsList}>
                  {order.OrderItems.map(item => (
                    <View key={item.id} style={s.itemRow}>
                      <Text style={s.itemName} numberOfLines={1}>
                        {item.Product?.name ?? 'Item'}
                      </Text>
                      <View style={s.itemRight}>
                        <Text style={s.itemQty}>×{item.quantity}</Text>
                        <Text style={s.itemTotal}>₹{Number(item.total).toFixed(2)}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={s.itemDivider} />
                  <View style={s.itemRow}>
                    <Text style={s.itemTotalLabel}>Order Total</Text>
                    <Text style={s.itemTotalValue}>₹{Number(order.total).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Payment */}
            <View style={[s.paymentBadge, isCod && s.paymentBadgeCod]}>
              <Ionicons
                name={isCod ? 'cash-outline' : 'card-outline'}
                size={18}
                color={isCod ? '#92400e' : '#1e40af'}
                style={{ marginRight: 8 }}
              />
              <View>
                <Text style={[s.paymentMode, isCod && s.paymentModeCod]}>
                  {order.payment_mode.toUpperCase()}
                </Text>
                {isCod && (
                  <Text style={s.paymentCollect}>Collect ₹{Number(order.total).toFixed(2)} from customer</Text>
                )}
              </View>
            </View>

            {order.notes ? (
              <View style={s.notesBox}>
                <Ionicons name="document-text-outline" size={14} color="#888" style={{ marginRight: 6 }} />
                <Text style={s.notesText}>{order.notes}</Text>
              </View>
            ) : null}

          </ScrollView>

          {/* Accept button */}
          <View style={s.modalFooter}>
            <Pressable
              style={[s.acceptConfirmBtn, accepting && s.acceptConfirmBtnDisabled]}
              onPress={onAccept}
              disabled={accepting}
            >
              {accepting ? (
                <ActivityIndicator size="small" color="#1a1a1a" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#1a1a1a" style={{ marginRight: 8 }} />
                  <Text style={s.acceptConfirmBtnText}>Accept Order</Text>
                </>
              )}
            </Pressable>
          </View>

        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ── Active delivery view ───────────────────────────────────────────────────────

function ActiveDeliveryView({
  order, delivering, onDeliver,
}: {
  order: OrderDetail;
  delivering: boolean;
  onDeliver: () => void;
}) {
  const isCod = order.payment_mode === 'cod';
  const outletAddr = [order.Outlet?.address1, order.Outlet?.address2, order.Outlet?.city, order.Outlet?.state]
    .filter(Boolean).join(', ');
  const deliveryAddr = [order.Address?.address1, order.Address?.address2, order.Address?.pincode]
    .filter(Boolean).join(', ');

  return (
    <View style={s.activeDeliveryWrap}>

      {/* Banner */}
      <View style={s.activeBanner}>
        <View style={s.activeBannerLeft}>
          <View style={s.activeDotLarge} />
          <Text style={s.activeBannerLabel}>Active Delivery</Text>
        </View>
        <Text style={s.activeBannerOrderNo}>{order.order_no}</Text>
      </View>

      {/* Pickup */}
      <View style={s.deliverySection}>
        <View style={s.deliverySectionHeader}>
          <View style={[s.deliveryIconCircle, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="storefront-outline" size={18} color="#16a34a" />
          </View>
          <Text style={s.deliverySectionTitle}>Pick up from</Text>
        </View>
        <View style={s.deliverySectionBody}>
          <Text style={s.deliveryName}>{order.Outlet?.name ?? '—'}</Text>
          {outletAddr ? <Text style={s.deliveryAddr}>{outletAddr}</Text> : null}
          {order.Outlet?.pincode ? <Text style={s.deliveryPincode}>Pincode: {order.Outlet.pincode}</Text> : null}
          {outletAddr ? (
            <Pressable style={s.directionsBtn} onPress={() => openMaps(outletAddr)}>
              <Ionicons name="navigate-outline" size={14} color="#16a34a" style={{ marginRight: 5 }} />
              <Text style={s.directionsBtnText}>Get Directions</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Deliver to */}
      <View style={s.deliverySection}>
        <View style={s.deliverySectionHeader}>
          <View style={[s.deliveryIconCircle, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="person-outline" size={18} color="#3b82f6" />
          </View>
          <Text style={s.deliverySectionTitle}>Deliver to</Text>
        </View>
        <View style={s.deliverySectionBody}>
          <Text style={s.deliveryName}>
            {order.User ? `${order.User.fname} ${order.User.lname}` : '—'}
          </Text>
          {order.User?.phone ? (
            <Text style={s.deliveryPhone}>
              <Ionicons name="call-outline" size={12} color="#888" /> {order.User.phone}
            </Text>
          ) : null}
          {deliveryAddr
            ? <Text style={s.deliveryAddr}>{deliveryAddr}</Text>
            : <Text style={s.deliveryAddr}>No delivery address on file</Text>
          }
          {deliveryAddr ? (
            <Pressable style={[s.directionsBtn, s.directionsBtnBlue]} onPress={() => openMaps(deliveryAddr)}>
              <Ionicons name="navigate-outline" size={14} color="#3b82f6" style={{ marginRight: 5 }} />
              <Text style={[s.directionsBtnText, { color: '#3b82f6' }]}>Get Directions</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Items */}
      {order.OrderItems && order.OrderItems.length > 0 && (
        <View style={s.deliverySection}>
          <View style={s.deliverySectionHeader}>
            <View style={[s.deliveryIconCircle, { backgroundColor: '#fefce8' }]}>
              <Ionicons name="bag-outline" size={18} color="#ca8a04" />
            </View>
            <Text style={s.deliverySectionTitle}>Items ({order.OrderItems.length})</Text>
          </View>
          <View style={s.itemsList}>
            {order.OrderItems.map(item => (
              <View key={item.id} style={s.itemRow}>
                <Text style={s.itemName} numberOfLines={1}>
                  {item.Product?.name ?? 'Item'}
                </Text>
                <View style={s.itemRight}>
                  <Text style={s.itemQty}>×{item.quantity}</Text>
                  <Text style={s.itemTotal}>₹{Number(item.total).toFixed(2)}</Text>
                </View>
              </View>
            ))}
            <View style={s.itemDivider} />
            <View style={s.itemRow}>
              <Text style={s.itemTotalLabel}>Order Total</Text>
              <Text style={s.itemTotalValue}>₹{Number(order.total).toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Payment */}
      <View style={[s.paymentBadge, isCod && s.paymentBadgeCod]}>
        <Ionicons
          name={isCod ? 'cash-outline' : 'card-outline'}
          size={18}
          color={isCod ? '#92400e' : '#1e40af'}
          style={{ marginRight: 8 }}
        />
        <View>
          <Text style={[s.paymentMode, isCod && s.paymentModeCod]}>
            {order.payment_mode.toUpperCase()}
          </Text>
          {isCod && (
            <Text style={s.paymentCollect}>Collect ₹{Number(order.total).toFixed(2)} from customer</Text>
          )}
        </View>
      </View>

      {order.notes ? (
        <View style={s.notesBox}>
          <Ionicons name="document-text-outline" size={14} color="#888" style={{ marginRight: 6 }} />
          <Text style={s.notesText}>{order.notes}</Text>
        </View>
      ) : null}

      {/* Deliver button */}
      <Pressable
        style={[s.deliverBtn, delivering && s.deliverBtnDisabled]}
        onPress={onDeliver}
        disabled={delivering}
      >
        {delivering ? (
          <ActivityIndicator size="small" color="#1a1a1a" />
        ) : (
          <>
            <Ionicons name="checkmark-done-outline" size={20} color="#1a1a1a" style={{ marginRight: 8 }} />
            <Text style={s.deliverBtnText}>Mark as Delivered</Text>
          </>
        )}
      </Pressable>

    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: Props) {
  const [activeTab,      setActiveTab]      = useState<Tab>('home');
  const [agent,          setAgent]          = useState<StoredAgent | null>(null);
  const [locStatus,      setLocStatus]      = useState<'checking' | 'denied' | 'granted'>('checking');
  const [location,       setLocation]       = useState<{ latitude: number; longitude: number } | null>(null);
  const [orders,         setOrders]         = useState<ActiveOrder[] | null>(null);
  const [ordersLoading,  setOrdersLoading]  = useState(false);
  const [outlets,        setOutlets]        = useState<NearbyOutlet[]>([]);
  const [outletsError,   setOutletsError]   = useState<string | null>(null);
  const [activeOrder,    setActiveOrder]    = useState<OrderDetail | null>(null);
  const [viewingOrder,   setViewingOrder]   = useState<OrderDetail | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [accepting,      setAccepting]      = useState(false);
  const [delivering,      setDelivering]      = useState(false);
  const [deliveredCount,  setDeliveredCount]  = useState(0);
  const [totalDeliveryFee, setTotalDeliveryFee] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load agent + check for in-progress delivery ───────────────────────────
  useEffect(() => {
    async function init() {
      const [stored, token] = await Promise.all([getStoredAgent(), getAuthToken()]);

      if (!stored && token) {
        await clearAuth();
        navigation.replace('Login');
        return;
      }
      setAgent(stored);

      // Restore active delivery from SecureStore
      if (token) {
        const savedId = await getActiveOrderId();
        if (savedId) {
          try {
            const detail = await api.get<OrderDetail>(`/api/delivery/orders/${savedId}/detail`, token);
            if (detail?.order_status === 'shipped') {
              setActiveOrder(detail);
            } else {
              await clearActiveOrderId();
            }
          } catch {
            await clearActiveOrderId();
          }
        }
      }
    }
    init();
  }, []);

  // ── Location permission ───────────────────────────────────────────────────
  const requestLocation = useCallback(async () => {
    setLocStatus('checking');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setLocStatus('denied'); return; }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    setLocStatus('granted');
  }, []);

  useEffect(() => { requestLocation(); }, []);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) return;
    setOrdersLoading(prev => orders === null ? true : prev);
    try {
      const params = location ? `?lat=${location.latitude}&lng=${location.longitude}` : '';
      const data = await api.get<ActiveOrder[]>(`/api/delivery/orders/active${params}`, token);
      setOrders(data ?? []);
    } catch {
      if (orders === null) setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [location]);

  const fetchOutlets = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) return;
    setOutletsError(null);
    try {
      const params = location ? `?lat=${location.latitude}&lng=${location.longitude}` : '';
      const data = await api.get<NearbyOutlet[]>(`/api/delivery/outlets/nearby${params}`, token);
      setOutlets(data ?? []);
    } catch (err) {
      setOutletsError(err instanceof Error ? err.message : 'Failed to load outlets');
    }
  }, [location]);

  // ── Polling — stops when there is an active delivery ─────────────────────
  useEffect(() => {
    if (locStatus !== 'granted') return;
    if (activeOrder !== null)    return; // pause while delivering

    fetchOrders();
    fetchOutlets();
    intervalRef.current = setInterval(() => { fetchOrders(); fetchOutlets(); }, 90_000);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [locStatus, fetchOrders, fetchOutlets, activeOrder]);

  // ── View order detail ─────────────────────────────────────────────────────
  const handleView = useCallback(async (orderId: number) => {
    const token = await getAuthToken();
    if (!token) return;
    setViewingLoading(true);
    try {
      const detail = await api.get<OrderDetail>(`/api/delivery/orders/${orderId}/detail`, token);
      setViewingOrder(detail);
    } catch {
      Alert.alert('Error', 'Could not load order details. Try again.');
    } finally {
      setViewingLoading(false);
    }
  }, []);

  // ── Accept order (called from detail modal) ───────────────────────────────
  const handleAccept = useCallback(async () => {
    if (!viewingOrder) return;
    const token = await getAuthToken();
    if (!token) return;
    setAccepting(true);
    try {
      await api.post(
        `/api/delivery/orders/${viewingOrder.id}/accept`,
        {},
        { Authorization: `Bearer ${token}` }
      );
      await setActiveOrderId(String(viewingOrder.id));
      setActiveOrder(viewingOrder);
      setViewingOrder(null);
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Could not accept order. Try again.'
      );
    } finally {
      setAccepting(false);
    }
  }, [viewingOrder]);

  // ── Mark as delivered ─────────────────────────────────────────────────────
  const handleDeliver = useCallback(async () => {
    if (!activeOrder) return;
    Alert.alert(
      'Confirm Delivery',
      'Mark this order as delivered?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delivered',
          onPress: async () => {
            const token = await getAuthToken();
            if (!token) return;
            setDelivering(true);
            try {
              await api.post(
                `/api/delivery/orders/${activeOrder.id}/deliver`,
                {},
                { Authorization: `Bearer ${token}` }
              );
              await clearActiveOrderId();
              setDeliveredCount(c => c + 1);
              setTotalDeliveryFee(f => f + (Number(activeOrder.delivery_charge) || 0));
              setActiveOrder(null);
              setOrders(null);
            } catch (err) {
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Could not mark as delivered. Try again.'
              );
            } finally {
              setDelivering(false);
            }
          },
        },
      ]
    );
  }, [activeOrder]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await clearAuth();
    await clearActiveOrderId();
    navigation.replace('Login');
  };

  // ── Render: location denied ───────────────────────────────────────────────
  if (locStatus === 'denied') {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <LocationDenied onRetry={requestLocation} />
      </SafeAreaView>
    );
  }

  const firstName = agent?.first_name ?? '';
  const today     = formatDate(new Date());

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="dark" />

      {/* Order detail modal */}
      {viewingOrder && (
        <OrderDetailModal
          order={viewingOrder}
          accepting={accepting}
          onAccept={handleAccept}
          onClose={() => setViewingOrder(null)}
        />
      )}

      {/* Spinner while fetching order detail */}
      {viewingLoading && !viewingOrder && (
        <View style={s.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      )}

      {/* Tab content */}
      {activeTab === 'orders'  && <OrdersTab />}
      {activeTab === 'wallet'  && <WalletTab />}
      {activeTab === 'profile' && <ProfileTab agent={agent} onLogout={handleLogout} />}

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        style={activeTab !== 'home' ? { display: 'none' } : undefined}
      >

        {/* ── Header ──────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.headerLeft}>
              <Text style={s.greeting}>{getGreeting()},</Text>
              <Text style={s.agentName} numberOfLines={1}>{firstName || '—'}</Text>
            </View>
            <Pressable style={s.avatar} onPress={() => setActiveTab('profile')}>
              <Text style={s.avatarText}>{firstName ? firstName[0].toUpperCase() : 'G'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.content}>

          {/* ── Today's summary ─────────────────────────────── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View>
                <Text style={s.cardTitle}>Today</Text>
                <Text style={s.cardDate}>{today}</Text>
              </View>
              <View style={s.activeBadge}>
                <View style={s.activeDot} />
                <Text style={s.activeText}>{activeOrder ? 'On delivery' : 'Active'}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.statsRow}>
              <StatItem label="Delivered"    value={String(deliveredCount)} borderRight />
              <StatItem label="Delivery Fee" value={`₹ ${totalDeliveryFee.toFixed(2)}`} accent borderRight />
              <StatItem label="Hours"        value="0h 0m" />
            </View>
          </View>

          {/* ── Active delivery OR orders + outlets ─────────── */}
          {activeOrder ? (
            <ActiveDeliveryView
              order={activeOrder}
              delivering={delivering}
              onDeliver={handleDeliver}
            />
          ) : (
            <>
              {/* Available orders */}
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Available Orders</Text>
                  {ordersLoading && orders !== null && (
                    <ActivityIndicator size="small" color="#16a34a" />
                  )}
                </View>

                {ordersLoading && orders === null ? (
                  <View style={s.centerBox}>
                    <ActivityIndicator size="large" color="#16a34a" />
                  </View>
                ) : orders && orders.length > 0 ? (
                  orders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onView={handleView}
                    />
                  ))
                ) : (
                  <View style={s.emptyBox}>
                    <View style={s.emptyIconWrap}>
                      <Ionicons name="search-outline" size={36} color="#aaa" />
                    </View>
                    <Text style={s.emptyTitle}>Looking for new orders…</Text>
                    <Text style={s.emptyDesc}>
                      We'll notify you as soon as an order is available nearby.
                      Checking every 90 seconds.
                    </Text>
                  </View>
                )}
              </View>

              {/* Nearby outlets */}
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Available Outlets</Text>
                  {outlets.length > 0 && (
                    <Text style={s.sectionCount}>{outlets.length}</Text>
                  )}
                </View>
                {outletsError ? (
                  <View style={s.emptyBox}>
                    <View style={[s.emptyIconWrap, { backgroundColor: '#fef2f2' }]}>
                      <Ionicons name="alert-circle-outline" size={36} color="#f87171" />
                    </View>
                    <Text style={[s.emptyTitle, { color: '#f87171' }]}>Could not load outlets</Text>
                    <Text style={s.emptyDesc}>{outletsError}</Text>
                  </View>
                ) : outlets.length > 0 ? (
                  outlets.map(outlet => <OutletCard key={outlet.id} outlet={outlet} />)
                ) : (
                  <View style={s.emptyBox}>
                    <View style={s.emptyIconWrap}>
                      <Ionicons name="storefront-outline" size={36} color="#aaa" />
                    </View>
                    <Text style={s.emptyTitle}>No outlets in range</Text>
                    <Text style={s.emptyDesc}>
                      No active outlets are within your delivery radius right now.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

        </View>
      </ScrollView>

      <BottomTabBar active={activeTab} onSelect={setActiveTab} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flexGrow: 1, backgroundColor: '#f5f5f5', paddingBottom: 90 },

  // Header
  header:     { backgroundColor: '#ffffff', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flex: 1, marginRight: 16 },
  greeting:   { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.45)', marginBottom: 2 },
  agentName:  { fontSize: 26, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5 },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffcc01', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },

  content: { paddingHorizontal: 16, paddingTop: 16 },

  // Summary card
  card:       { backgroundColor: '#fff', borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  cardTitle:  { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  cardDate:   { fontSize: 12, color: '#aaa', marginTop: 2 },
  activeBadge:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 5 },
  activeDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a' },
  activeText: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  divider:    { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 18 },
  statsRow:   { flexDirection: 'row' },
  statWrap:   { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statBorder: { borderRightWidth: 1, borderRightColor: '#f0f0f0' },
  statVal:    { fontSize: 20, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5 },
  statAccent: { color: '#16a34a' },
  statLabel:  { fontSize: 10, fontWeight: '600', color: '#bbb', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 },

  // Loading overlay (while fetching order detail)
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'transparent' },

  // Section
  section:       { marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  sectionCount:  { fontSize: 12, fontWeight: '700', color: '#16a34a', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },

  // Order card
  orderCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  orderRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo:     { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  modeBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  modeText:    { fontSize: 11, fontWeight: '700' },
  outletName:  { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 8 },
  orderAmount: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginTop: 6 },
  orderTime:   { fontSize: 12, color: '#aaa', marginTop: 6 },

  // View order button
  viewBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, backgroundColor: '#f5f5f5', borderRadius: 10, paddingVertical: 10 },
  viewBtnText: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },

  // Empty / error states
  centerBox:    { alignItems: 'center', paddingVertical: 40 },
  emptyBox:     { backgroundColor: '#fff', borderRadius: 18, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  emptyIconWrap:{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  emptyDesc:    { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },

  // Outlet card
  outletCard:       { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  outletCardRow:    { flexDirection: 'row', alignItems: 'center' },
  outletIconWrap:   { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  outletCardInfo:   { flex: 1, marginRight: 8 },
  outletCardName:   { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  outletCardAddr:   { fontSize: 12, color: '#999', marginTop: 2 },
  outletCardDist:   { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  outletCardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  radiusPill:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  radiusText:       { fontSize: 11, color: '#888', fontWeight: '500' },
  instantPill:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  instantText:      { fontSize: 11, color: '#f59e0b', fontWeight: '600' },

  // Active delivery view
  activeDeliveryWrap: { marginBottom: 20 },

  activeBanner:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffcc01', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  activeBannerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeDotLarge:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1a1a1a' },
  activeBannerLabel:  { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  activeBannerOrderNo:{ fontSize: 13, fontWeight: '700', color: '#1a1a1a', opacity: 0.7 },

  deliverySection:      { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  deliverySectionHeader:{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  deliveryIconCircle:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deliverySectionTitle: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8 },
  deliverySectionBody:  { paddingLeft: 46 },
  deliveryName:   { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  deliveryPhone:  { fontSize: 13, color: '#888', marginBottom: 4 },
  deliveryAddr:   { fontSize: 13, color: '#666', lineHeight: 18 },
  deliveryPincode:{ fontSize: 12, color: '#aaa', marginTop: 2 },

  directionsBtn:     { flexDirection: 'row', alignItems: 'center', marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  directionsBtnBlue: { backgroundColor: '#eff6ff' },
  directionsBtnText: { fontSize: 13, fontWeight: '600', color: '#16a34a' },

  itemsList:      { paddingLeft: 46 },
  itemRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  itemName:       { flex: 1, fontSize: 14, color: '#333', marginRight: 8 },
  itemRight:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemQty:        { fontSize: 13, color: '#888', fontWeight: '600' },
  itemTotal:      { fontSize: 14, fontWeight: '600', color: '#1a1a1a', minWidth: 60, textAlign: 'right' },
  itemDivider:    { height: 1, backgroundColor: '#f0f0f0', marginVertical: 6 },
  itemTotalLabel: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  itemTotalValue: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },

  paymentBadge:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 14, padding: 14, marginBottom: 10 },
  paymentBadgeCod: { backgroundColor: '#fef3c7' },
  paymentMode:     { fontSize: 14, fontWeight: '700', color: '#1e40af' },
  paymentModeCod:  { color: '#92400e' },
  paymentCollect:  { fontSize: 12, color: '#92400e', marginTop: 2 },

  notesBox:  { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  notesText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },

  deliverBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, marginTop: 4 },
  deliverBtnDisabled: { opacity: 0.6 },
  deliverBtnText:     { fontSize: 16, fontWeight: '700', color: '#ffffff' },

  // Order detail modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#f5f5f5', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalCloseBtn:{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  modalScroll:  { padding: 16, paddingBottom: 8 },
  modalOrderBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  modalOrderNo:    { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  modalOrderTime:  { fontSize: 13, color: '#aaa', fontWeight: '500' },
  modalFooter:  { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },

  acceptConfirmBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffcc01', borderRadius: 14, paddingVertical: 16 },
  acceptConfirmBtnDisabled: { opacity: 0.6 },
  acceptConfirmBtnText:     { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },

  // Location denied
  permWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permIcon:    { fontSize: 52, marginBottom: 20 },
  permTitle:   { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 10, textAlign: 'center' },
  permDesc:    { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permBtn:     { height: 52, paddingHorizontal: 40, backgroundColor: '#ffcc01', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  permBtnText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
});

// ── Bottom tab bar styles ─────────────────────────────────────────────────────

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#ffcc01',
  },
});

// ── Placeholder tab styles ────────────────────────────────────────────────────

// ── Wallet tab styles ─────────────────────────────────────────────────────────

const wt = StyleSheet.create({
  scroll:      { padding: 16, paddingBottom: 100 },

  card:        { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 20, position: 'relative' },
  cardIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fffbeb', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardTitle:   { flex: 1, fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  dotsBtn:     { padding: 4 },
  menu:        { position: 'absolute', top: 36, right: 0, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8, zIndex: 99, minWidth: 180 },
  menuItem:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  menuItemDisabled:    { opacity: 0.45 },
  menuItemText:        { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  menuItemTextDisabled:{ color: '#c4c4c4' },

  balanceRow:    { alignItems: 'center', marginBottom: 20 },
  balanceLabel:  { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  balanceAmt:    { fontSize: 36, fontWeight: '800', color: '#1a1a1a', letterSpacing: -1 },
  minPayoutHint: { fontSize: 11, color: '#f59e0b', fontWeight: '500', marginTop: 6, textAlign: 'center' },

  divider:     { height: 1, backgroundColor: '#f0f0f0', marginBottom: 16 },

  statsRow:    { flexDirection: 'row' },
  statItem:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#f0f0f0' },
  statVal:     { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  statLabel:   { fontSize: 10, fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.8 },

  sectionTitle:{ fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },

  emptyBox:    { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', borderRadius: 14 },
  emptyText:   { marginTop: 10, fontSize: 13, color: '#aaa' },

  payoutRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  payoutLeft:  {},
  payoutAmt:   { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  payoutDate:  { fontSize: 12, color: '#aaa' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText:  { fontSize: 12, fontWeight: '700' },

  modalOverlay:{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalTitle:  { fontSize: 18, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  modalSub:    { fontSize: 13, color: '#6b7280', marginBottom: 24 },
  amtRow:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 20, backgroundColor: '#f9fafb' },
  amtPrefix:   { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginRight: 6 },
  amtInput:    { flex: 1, fontSize: 22, fontWeight: '700', color: '#1a1a1a', paddingVertical: 10 },
  confirmBtn:  { backgroundColor: '#ffcc01', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  cancelBtn:   { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { fontSize: 15, color: '#6b7280', fontWeight: '600' },
});

// ── Orders tab styles ─────────────────────────────────────────────────────────

const ot = StyleSheet.create({
  filterBar:     { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  filterContent: {},
  chip:          { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: '#f3f4f6' },
  chipActive:    { backgroundColor: '#ffcc01' },
  chipLabel:     { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  chipLabelActive: { color: '#1a1a1a' },

  customBox:      { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  customRow:      { flexDirection: 'row', marginBottom: 12 },
  customLabel:    { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6 },
  datePressable:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f9fafb' },
  dateText:       { fontSize: 13, color: '#1a1a1a', fontWeight: '500' },
  applyBtn:       { backgroundColor: '#ffcc01', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  applyBtnText:   { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  pickerOverlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet:    { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  pickerHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  pickerTitle:    { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  pickerDone:     { fontSize: 16, fontWeight: '700', color: '#ffcc01' },

  summaryCard:    { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, marginBottom: 4, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#f0f0f0' },
  summaryVal:     { fontSize: 17, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.4 },
  summaryLabel:   { fontSize: 10, fontWeight: '600', color: '#bbb', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },

  listContent:  { padding: 16, paddingBottom: 100 },

  orderCard:    { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNo:      { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  deliveredBadge:     { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  deliveredBadgeText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  outletName:   { fontSize: 12, color: '#888', marginBottom: 2 },
  customerName: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 10 },
  amtRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 8 },
  amtLabel:     { fontSize: 10, fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  amtVal:       { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
  orderTime:    { fontSize: 11, color: '#aaa', textAlign: 'right' },
});

const ph = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Profile
  profileScroll:  { flexGrow: 1, backgroundColor: '#f5f5f5', padding: 20, paddingBottom: 32 },
  avatarWrap:     { alignItems: 'center', paddingVertical: 28 },
  avatar:         { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ffcc01', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:     { fontSize: 26, fontWeight: '800', color: '#1a1a1a' },
  profileName:    { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  profileSub:     { fontSize: 13, color: '#9ca3af' },
  infoCard:       { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoRow:        { flexDirection: 'row', alignItems: 'center', padding: 16 },
  infoIcon:       { marginRight: 12 },
  infoValue:      { fontSize: 14, color: '#374151', fontWeight: '500' },
  logoutBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  logoutText:     { fontSize: 15, fontWeight: '700', color: '#ef4444' },

  actionBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionBtnText:  { fontSize: 15, fontWeight: '600', color: '#374151' },

  modalOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet:     { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalTitle:     { fontSize: 18, fontWeight: '800', color: '#1a1a1a', marginBottom: 20 },
  fieldLabel:     { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6, marginTop: 12 },
  fieldRow:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#f9fafb' },
  fieldInput:     { flex: 1, fontSize: 15, color: '#1a1a1a', paddingVertical: 12 },
  submitBtn:      { backgroundColor: '#ffcc01', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 10 },
  submitBtnText:  { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  cancelBtn:      { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText:  { fontSize: 15, color: '#6b7280', fontWeight: '600' },
});
