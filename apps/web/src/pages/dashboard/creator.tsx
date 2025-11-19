import Head from 'next/head';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeDatasetUpload,
  fetchCloneStatus,
  fetchCreatorProfile,
  requestDatasetUpload,
  startCloneJob,
  updateCreatorProfile
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="dashboard__section">
    <div className="dashboard__section-header">
      <h2>{title}</h2>
    </div>
    {children}
  </section>
);

export default function CreatorDashboard() {
  const { token, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [personaDraft, setPersonaDraft] = useState('{\n  "tone": "friendly",\n  "topics": ["gaming", "music"]\n}');
  const [selectedDataset, setSelectedDataset] = useState<string>();
  const [activeJob, setActiveJob] = useState<string>();
  const [cloneStatus, setCloneStatus] = useState<string>();

  const isCreator = user?.role === 'creator';

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['creator-profile'],
    queryFn: () => fetchCreatorProfile(token!),
    enabled: Boolean(token && isCreator)
  });

  useEffect(() => {
    if (profile?.persona) {
      setPersonaDraft(JSON.stringify(profile.persona, null, 2));
    }
  }, [profile?.persona]);

  useEffect(() => {
    if (!isCreator && !isLoading) {
      router.replace('/');
    }
  }, [isCreator, isLoading, router]);

  const updateProfileMutation = useMutation({
    mutationFn: (form: FormData) =>
      updateCreatorProfile(token!, profile!.id, {
        displayName: form.get('displayName')?.toString(),
        heroImageUrl: form.get('heroImageUrl')?.toString(),
        bio: form.get('bio')?.toString(),
        pricePerMinute: Number(form.get('pricePerMinute')),
        humeVoiceId: form.get('humeVoiceId')?.toString(),
        beyondPresenceAvatarId: form.get('beyondPresenceAvatarId')?.toString(),
        persona: personaDraft ? JSON.parse(personaDraft) : undefined
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
    }
  });

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateProfileMutation.mutate(form);
  };

  const handleFileUpload = async (file: File) => {
    if (!profile) return;
    const { uploadUrl, dataset } = await requestDatasetUpload(token!, profile.id, {
      filename: file.name,
      contentType: file.type || 'application/octet-stream'
    });
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });
    await completeDatasetUpload(token!, profile.id, dataset.id, { sizeBytes: file.size });
    setSelectedDataset(dataset.id);
    await refetch();
  };

  useEffect(() => {
    if (!activeJob || !profile || !token) return;
    const interval = setInterval(async () => {
      try {
        const status = await fetchCloneStatus(token, profile.id, activeJob);
        setCloneStatus(status.status);
        if (status.status === 'success' || status.status === 'ready' || status.status === 'failed') {
          clearInterval(interval);
          setActiveJob(undefined);
          await refetch();
        }
      } catch (error) {
        console.error(error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeJob, profile, token, refetch]);

  const readyDatasets = useMemo(() => profile?.datasets ?? [], [profile]);

  if (!isCreator) {
    return null;
  }

  if (isLoading || !profile) {
    return (
      <main className="dashboard">
        <p>Loading creator profile...</p>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Creator Studio • strmr.ai</title>
      </Head>
      <main className="dashboard">
        <header className="dashboard__hero">
          <div>
            <p className="eyebrow">Creator Studio</p>
            <h1>{profile?.displayName || user?.displayName || user?.email}</h1>
            <p>Configure your AI influencer, upload new datasets, and trigger Beyond Presence + Hume clone builds.</p>
            {cloneStatus && <span className="status">Last build: {cloneStatus}</span>}
          </div>
        </header>

        <Section title="Profile & Pricing">
          <form className="dashboard__form" onSubmit={handleProfileSubmit}>
            <label>Display name</label>
            <input name="displayName" defaultValue={profile?.displayName ?? ''} required />

            <label>Hero image URL</label>
            <input name="heroImageUrl" defaultValue={profile?.heroImageUrl ?? ''} placeholder="https://..." />

            <label>Bio</label>
            <textarea name="bio" defaultValue={profile?.bio ?? ''} rows={3} />

            <label>Price per minute (cents)</label>
            <input type="number" name="pricePerMinute" defaultValue={profile?.pricePerMinute ?? 500} min={100} />

            <div className="form-row">
              <div>
                <label>Hume EVI Voice ID</label>
                <input name="humeVoiceId" defaultValue={profile?.humeVoiceId ?? ''} />
              </div>
              <div>
                <label>Beyond Presence Avatar ID</label>
                <input name="beyondPresenceAvatarId" defaultValue={profile?.beyondPresenceAvatarId ?? ''} />
              </div>
            </div>

            <label>Persona JSON</label>
            <textarea value={personaDraft} onChange={(e) => setPersonaDraft(e.target.value)} rows={6} />

            <button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </Section>

        <Section title="Datasets">
          <div className="dataset-uploader">
            <label htmlFor="datasetUpload" className="upload-dropzone">
              <span>Drop audio/video dataset</span>
            </label>
            <input
              id="datasetUpload"
              type="file"
              accept="audio/*,video/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleFileUpload(file);
                }
              }}
            />
          </div>
          <div className="dataset-list">
            {readyDatasets.length === 0 && <p>No datasets uploaded yet.</p>}
            {readyDatasets.map((dataset) => (
              <div key={dataset.id} className={`dataset-card dataset-card--${dataset.status}`}>
                <div>
                  <strong>{dataset.objectKey.split('/').pop()}</strong>
                  <p>Status: {dataset.status}</p>
                </div>
                <label>
                  <input
                    type="radio"
                    name="dataset"
                    value={dataset.id}
                    checked={selectedDataset === dataset.id}
                    onChange={() => setSelectedDataset(dataset.id)}
                  />
                  Use for next build
                </label>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Clone & Deploy">
          <p>
            Select a dataset and run the orchestrator pipeline. We&apos;ll stream it through Hume EVI and Beyond Presence, then push the avatar
            manifest to LiveKit.
          </p>
          <button
            disabled={!selectedDataset || !profile || activeJob !== undefined}
            onClick={async () => {
              if (!selectedDataset || !profile) return;
              const job = await startCloneJob(token!, profile.id, selectedDataset);
              setActiveJob(job.jobId);
              setCloneStatus('processing');
            }}
          >
            {activeJob ? 'Building...' : 'Start new clone build'}
          </button>
          {activeJob && <p>Job {activeJob} is running. This page will refresh when it completes.</p>}
        </Section>
      </main>
    </>
  );
}

