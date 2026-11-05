const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 1000 }
];

test('editor adapts and renders the 3D garment at mobile, tablet, and desktop sizes', async ({ browser }) => {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/editor-3d.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.LFEditor3D?.preview));
    await page.getByRole('button', { name: 'Vista 3D' }).click();
    await expect(page.locator('#garment-3d-canvas')).toBeVisible();

    const visualState = await page.evaluate(() => {
      const canvas = document.getElementById('garment-3d-canvas');
      const nav = document.querySelector('.editor-bottom-nav');
      const layout = document.querySelector('.layout');
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      window.LFEditor3D.preview.renderer.render(window.LFEditor3D.preview.scene, window.LFEditor3D.preview.camera);
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      context.readPixels(0, 0, canvas.width, canvas.height, context.RGBA, context.UNSIGNED_BYTE, pixels);
      let nonBackgroundPixels = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index] > 45 || pixels[index + 1] > 48 || pixels[index + 2] > 55) nonBackgroundPixels += 1;
      }
      return {
        canvasWidth: canvas.clientWidth,
        canvasHeight: canvas.clientHeight,
        nonBackgroundPixels,
        hasWebGL: Boolean(context),
        navVisible: nav.getBoundingClientRect().height > 0,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        view: layout.dataset.view
      };
    });

    expect(visualState.hasWebGL, `${viewport.name} should have WebGL`).toBe(true);
    expect(visualState.canvasWidth, `${viewport.name} canvas width`).toBeGreaterThan(240);
    expect(visualState.canvasHeight, `${viewport.name} canvas height`).toBeGreaterThan(300);
    expect(visualState.nonBackgroundPixels, `${viewport.name} rendered pixels`).toBeGreaterThan(5000);
    expect(visualState.navVisible, `${viewport.name} bottom nav`).toBe(true);
    expect(visualState.scrollWidth, `${viewport.name} horizontal overflow`).toBeLessThanOrEqual(visualState.viewportWidth + 1);
    expect(visualState.view).toBe('3d');
    expect(pageErrors, `${viewport.name} browser errors`).toEqual([]);
    await page.screenshot({ path: `test-results/editor-${viewport.name}.png`, fullPage: true });

    await page.getByRole('button', { name: /Recursos/ }).click();
    await expect(page.locator('[data-tool-panel="resources"]')).toBeVisible();
    await page.locator('[data-shape="star"]').click();
    expect(await page.evaluate(() => window.LFUTURE_EditorScenes[0].state.elementos.some(element => element.forma === 'star'))).toBe(true);

    await page.getByRole('button', { name: /Plantillas/ }).click();
    await page.locator('[data-template="sueter-oversize"]').click();
    await expect(page.locator('#template-confirm')).toBeVisible();
    await page.locator('#template-confirm-no').click();
    expect(await page.evaluate(() => window.LFUTURE_EditorScenes[0].state.shirt.type)).not.toBe('sweater');
    await page.close();
  }

});