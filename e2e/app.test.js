describe('App', () => {
  beforeEach(async () => {
    await device.launchApp();
  });

  it('should show welcome screen', async () => {
    await expect(element(by.id('welcome'))).toBeVisible();
  });

  it('should handle navigation', async () => {
    await element(by.id('navigation-button')).tap();
    await expect(element(by.id('new-screen'))).toBeVisible();
  });

  it('should handle user input', async () => {
    await element(by.id('input-field')).typeText('Test Input');
    await expect(element(by.id('input-field'))).toHaveText('Test Input');
  });

  it('should handle data loading', async () => {
    await element(by.id('refresh-button')).tap();
    await waitFor(element(by.id('data-loaded')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should maintain performance under load', async () => {
    // Simulate rapid user interactions
    for (let i = 0; i < 10; i++) {
      await element(by.id('action-button')).tap();
      await element(by.id('navigation-button')).tap();
      await element(by.id('back-button')).tap();
    }

    // Check if app is still responsive
    await expect(element(by.id('welcome'))).toBeVisible();
  });

  it('should handle offline mode', async () => {
    await device.setURLBlacklist(['.*']);
    await element(by.id('refresh-button')).tap();
    await expect(element(by.id('offline-message'))).toBeVisible();
  });

  it('should handle orientation changes', async () => {
    await device.setOrientation('landscape');
    await expect(element(by.id('welcome'))).toBeVisible();
    await device.setOrientation('portrait');
    await expect(element(by.id('welcome'))).toBeVisible();
  });
}); 