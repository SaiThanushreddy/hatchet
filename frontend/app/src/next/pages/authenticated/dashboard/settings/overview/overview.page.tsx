import { useEffect, useState } from 'react';
import { Button } from '@/next/components/ui/button';
import { Separator } from '@/next/components/ui/separator';
import { Label } from '@/next/components/ui/label';
import { Switch } from '@/next/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/next/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/next/components/ui/alert';
import { useCurrentTenantId, useTenantDetails } from '@/next/hooks/use-tenant';
import {
  TenantUIVersion,
  TenantVersion,
  UpdateTenantRequest,
} from '@/lib/api/generated/data-contracts';
import { UpdateTenantForm } from './components/update-tenant-form';
import { Lock } from 'lucide-react';
import BasicLayout from '@/next/components/layouts/basic.layout';
import { Headline, PageTitle } from '@/next/components/ui/page-header';
import { ROUTES } from '@/next/lib/routes';
import useApiMeta from '@/next/hooks/use-api-meta';
import useCloudFeatureFlags from '@/pages/auth/hooks/use-cloud-feature-flags';

export default function SettingsOverviewPage() {
  const { isCloud } = useApiMeta();
  const { tenantId } = useCurrentTenantId();

  const featureFlags = useCloudFeatureFlags(tenantId);

  const hasUIVersionFlag =
    featureFlags?.data['has-ui-version-upgrade-available'] === 'true';

  return (
    <BasicLayout>
      <Headline>
        <PageTitle description="Manage your tenant settings">
          General Tenant Settings
        </PageTitle>
      </Headline>
      <Separator className="my-4" />
      <UpdateTenant />
      {isCloud ? (
        <>
          <Separator className="my-4" />
          <AnalyticsOptOut />
        </>
      ) : null}
      <Separator className="my-4" />
      <TenantVersionSwitcher />
      {hasUIVersionFlag ? (
        <>
          <Separator className="my-4" />
          <UIVersionSwitcher />
        </>
      ) : null}
    </BasicLayout>
  );
}

function UpdateTenant() {
  const { tenant, update } = useTenantDetails();

  if (!tenant) {
    return null;
  }

  return (
    <div className="w-fit">
      <UpdateTenantForm
        isLoading={update.isPending}
        onSubmit={(data: UpdateTenantRequest) => {
          update.mutate(data);
        }}
        tenant={tenant}
      />
    </div>
  );
}

function AnalyticsOptOut() {
  const { tenant, update } = useTenantDetails();
  const [checkedState, setCheckedState] = useState(false);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    setCheckedState(!!tenant?.analyticsOptOut);
    setChanged(false);
  }, [tenant]);

  if (!tenant) {
    return null;
  }

  // Set initial state based on tenant data
  if (checkedState !== !!tenant.analyticsOptOut && !changed) {
    setCheckedState(!!tenant.analyticsOptOut);
  }

  const save = () => {
    update.mutate({ analyticsOptOut: checkedState });
    setChanged(false);
  };

  return (
    <div className="flex flex-col gap-y-2">
      <h2 className="text-xl font-semibold leading-tight text-foreground">
        Analytics Opt-Out
      </h2>
      <p className="text-sm text-muted-foreground">
        Choose whether to opt out of all analytics tracking.
      </p>
      <div className="flex items-center space-x-2">
        <Switch
          id="analytics-opt-out"
          checked={checkedState}
          onCheckedChange={() => {
            setCheckedState(!checkedState);
            setChanged(true);
          }}
        />
        <Label htmlFor="analytics-opt-out" className="text-sm">
          Analytics Opt-Out
        </Label>
      </div>
      {changed ? (
        <Button
          onClick={save}
          className="w-fit mt-2"
          loading={update.isPending}
        >
          Save
        </Button>
      ) : null}
    </div>
  );
}

function TenantVersionSwitcher() {
  const { tenant, update } = useTenantDetails();
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);

  if (!tenant || tenant.version === TenantVersion.V0) {
    return (
      <div>
        This is a V0 tenant. Please upgrade to V1 or use V0 from the frontend.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-2">
      <h2 className="text-xl font-semibold leading-tight text-foreground">
        Tenant Version
      </h2>
      <p className="text-sm text-muted-foreground">
        You can downgrade your tenant to V0 if needed. Please help us improve V1
        by reporting any bugs in our{' '}
        <a
          href={ROUTES.common.feedback}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:underline"
        >
          Github issues.
        </a>
      </p>
      <Button
        onClick={() => setShowDowngradeModal(true)}
        loading={update.isPending}
        variant="destructive"
        className="w-fit"
      >
        Downgrade to V0
      </Button>

      <Dialog open={showDowngradeModal} onOpenChange={setShowDowngradeModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Downgrade to V0</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="warning">
              <Lock className="w-4 h-4 mr-2" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Downgrading to V0 will remove access to V1 features and may
                affect your existing workflows. This action should only be taken
                if absolutely necessary.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDowngradeModal(false)}
              loading={update.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                update.mutate({ version: TenantVersion.V0 });
                setShowDowngradeModal(false);
              }}
              loading={update.isPending}
            >
              Confirm Downgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UIVersionSwitcher() {
  const { tenant, update } = useTenantDetails();
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);

  if (!tenant?.uiVersion || tenant.uiVersion === TenantUIVersion.V0) {
    return (
      <div>
        This is a V0 tenant. Please upgrade to V1 or use V0 from the frontend.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-2">
      <h2 className="text-xl font-semibold leading-tight text-foreground">
        UI Version
      </h2>
      <p className="text-sm text-muted-foreground">
        You can downgrade your dashboard to V0 if needed.
      </p>
      <Button
        onClick={() => setShowDowngradeModal(true)}
        loading={update.isPending}
        variant="destructive"
        className="w-fit"
      >
        Downgrade to the V0 UI
      </Button>

      <Dialog open={showDowngradeModal} onOpenChange={setShowDowngradeModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Downgrade to V0</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            Please confirm your downgrade to the V0 UI version. Note that this
            will have no effect on any of your workflows, and is a UI-only
            change.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDowngradeModal(false)}
              loading={update.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const tenant = await update.mutateAsync({
                  uiVersion: TenantUIVersion.V0,
                });

                if (tenant.uiVersion !== TenantUIVersion.V0) {
                  return;
                }

                setShowDowngradeModal(false);
                window.location.href = `/tenants/${tenant.metadata.id}/runs`;
              }}
              loading={update.isPending}
            >
              Confirm Downgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
