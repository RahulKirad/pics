import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { QuotaBar } from '@/components/billing/QuotaBar';
import { billingService } from '@/services/billing';
import { formatBytes, formatNumber } from '@/lib/format';
import { formatCurrency, loadRazorpayScript, openRazorpayCheckout } from '@/lib/razorpay';
import type { PlanSummary } from '@photo-platform/shared-types';
import { PlanTier } from '@photo-platform/shared-types';

function PlanCard({
  plan,
  currentTier,
  onUpgrade,
  upgrading,
  billingCycle,
  razorpayConfigured,
}: {
  plan: PlanSummary;
  currentTier: PlanTier | null;
  onUpgrade: (tier: PlanTier) => void;
  upgrading: boolean;
  billingCycle: 'monthly' | 'yearly';
  razorpayConfigured: boolean;
}) {
  const isCurrent = plan.tier === currentTier;
  const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const isFree = price === 0;

  return (
    <Card className={isCurrent ? 'border-primary' : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          {isCurrent && <Badge variant="secondary">Current</Badge>}
        </div>
        {plan.description && (
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold">
            {isFree ? 'Free' : formatCurrency(price)}
          </p>
          {!isFree && (
            <p className="text-xs text-muted-foreground">
              per {billingCycle === 'yearly' ? 'year' : 'month'}
            </p>
          )}
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary shrink-0" />
            {plan.maxEvents} events
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary shrink-0" />
            {formatNumber(plan.maxPhotos)} photos
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary shrink-0" />
            {plan.maxStorageGb} GB storage
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary shrink-0" />
            {formatNumber(plan.maxFaceSearches)} guest searches
          </li>
        </ul>
        {!isCurrent && !isFree && (
          <Button
            className="w-full"
            disabled={!razorpayConfigured || upgrading}
            onClick={() => onUpgrade(plan.tier)}
          >
            {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upgrade'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [upgradingTier, setUpgradingTier] = useState<PlanTier | null>(null);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['billing-overview'],
    queryFn: billingService.getOverview,
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: billingService.listPlans,
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: billingService.listInvoices,
  });

  const verifyMutation = useMutation({
    mutationFn: billingService.verifyPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-overview'] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      setCheckoutError(null);
    },
    onError: (error: Error) => {
      setCheckoutError(error.message);
    },
  });

  const handleUpgrade = async (tier: PlanTier) => {
    if (tier === PlanTier.FREE) return;

    setCheckoutError(null);
    setUpgradingTier(tier);

    try {
      const checkout = await billingService.createCheckout({ planTier: tier, billingCycle });
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load Razorpay checkout');
      }

      const response = await openRazorpayCheckout({
        key: checkout.razorpayKeyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: 'PhotoFlow',
        description: `${tier} plan (${billingCycle})`,
        order_id: checkout.orderId,
      });

      await verifyMutation.mutateAsync({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
    } catch (error) {
      if (error instanceof Error && error.message !== 'Payment cancelled') {
        setCheckoutError(error.message);
      }
    } finally {
      setUpgradingTier(null);
    }
  };

  const currentTier: PlanTier | null = overview?.subscription?.plan.tier ?? PlanTier.FREE;
  const isLoading = overviewLoading || plansLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">Manage your plan, usage, and billing</p>
      </div>

      {checkoutError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {checkoutError}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-48 w-full max-w-3xl" />
      ) : overview && (
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">Current plan</CardTitle>
              <Badge>{overview.subscription?.status ?? 'TRIALING'}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-2xl font-bold">{overview.subscription?.plan.name ?? 'Free Trial'}</p>
              {overview.subscription?.trialEndsAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Trial ends {new Date(overview.subscription.trialEndsAt).toLocaleDateString()}
                </p>
              )}
              {overview.subscription?.currentPeriodEnd && overview.subscription.status === 'ACTIVE' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Renews {new Date(overview.subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <QuotaBar label="Events" metric={overview.usage.events} formatValue={formatNumber} />
              <QuotaBar label="Photos" metric={overview.usage.photos} formatValue={formatNumber} />
              <QuotaBar
                label="Storage"
                metric={overview.usage.storageBytes}
                formatValue={formatBytes}
              />
              <QuotaBar
                label="Guest searches"
                metric={overview.usage.faceSearches}
                formatValue={formatNumber}
              />
            </div>
            {!overview.razorpayConfigured && (
              <p className="text-sm text-muted-foreground">
                Online upgrades require Razorpay credentials. Contact support or configure billing in your environment.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Available plans</h2>
          <div className="inline-flex rounded-lg border p-1">
            {(['monthly', 'yearly'] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                className={`px-3 py-1.5 text-sm rounded-md capitalize ${
                  billingCycle === cycle ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
                onClick={() => setBillingCycle(cycle)}
              >
                {cycle}
              </button>
            ))}
          </div>
        </div>

        {plansLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-72" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(plans ?? []).map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentTier={currentTier}
                onUpgrade={handleUpgrade}
                upgrading={upgradingTier === plan.tier}
                billingCycle={billingCycle}
                razorpayConfigured={overview?.razorpayConfigured ?? false}
              />
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading && <Skeleton className="h-24" />}
          {!invoicesLoading && (invoices?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          )}
          {invoices && invoices.length > 0 && (
            <div className="divide-y">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-muted-foreground">{invoice.planName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(invoice.amount, invoice.currency)}</p>
                    <p className="text-muted-foreground">
                      {new Date(invoice.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
