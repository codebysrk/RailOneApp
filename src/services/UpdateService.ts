import { Linking } from 'react-native';

const GITHUB_OWNER = 'codebysrk';
const GITHUB_REPO = 'RailOneApp';
const CURRENT_APP_VERSION = '1.0.0';

export interface ReleaseInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string;
  publishedAt: string;
}

// Compare semantic versions (e.g. 1.0.1 > 1.0.0)
const isNewerVersion = (latest: string, current: string): boolean => {
  const cleanLatest = latest.replace(/^v/i, '').trim();
  const cleanCurrent = current.replace(/^v/i, '').trim();

  const latestParts = cleanLatest.split('.').map(p => parseInt(p, 10) || 0);
  const currentParts = cleanCurrent.split('.').map(p => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
};

export const UpdateService = {
  getCurrentVersion: () => CURRENT_APP_VERSION,

  checkForUpdate: async (): Promise<ReleaseInfo | null> => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'RailOne-Mobile-App',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const tagName = data.tag_name || '';
      const latestVersion = tagName.replace(/^v/i, '').trim();
      const currentVersion = CURRENT_APP_VERSION;

      const updateAvailable = isNewerVersion(latestVersion, currentVersion);

      // Look for an APK asset in the release
      let downloadUrl = data.html_url || `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
      if (Array.isArray(data.assets) && data.assets.length > 0) {
        const apkAsset = data.assets.find((asset: any) =>
          asset.name.toLowerCase().endsWith('.apk')
        );
        if (apkAsset && apkAsset.browser_download_url) {
          downloadUrl = apkAsset.browser_download_url;
        }
      }

      return {
        updateAvailable,
        currentVersion,
        latestVersion,
        releaseName: data.name || `Version ${latestVersion}`,
        releaseNotes: data.body || 'Performance improvements and bug fixes.',
        downloadUrl,
        publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString() : '',
      };
    } catch (error) {
      console.warn('Failed to check for updates:', error);
      return null;
    }
  },

  openUpdateUrl: async (downloadUrl: string) => {
    try {
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
      } else {
        await Linking.openURL(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`);
      }
    } catch (error) {
      console.warn('Error opening update URL:', error);
    }
  },
};

