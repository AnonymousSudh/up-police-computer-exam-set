const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fullFormBank = require('../src/data/full-form-exam.json');
const fullForms = {
  ...fullFormBank,
  title: 'Full Form MCQ — Part 1 (Simple)',
  questions: fullFormBank.questions.slice(0, 100),
};
const total = fullForms.questions.length;
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {})});
  const errors = [];
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({viewport: {width, height: 850}, reducedMotion: 'reduce'});
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('up-police-exams', JSON.stringify([{id: 'computer-operator-full-forms', title: 'Stale copy', durationMinutes: 1, questions: [{id:'old', text:'Old', options:['a','b'], correctAnswer:0}]}])));
    await page.goto('http://127.0.0.1:4173/');
    const card = page.locator('.exam-card').filter({has:page.getByRole('heading', {name:fullForms.title, exact:true})});
    await card.getByText(`${total} Questions`, {exact:true}).waitFor();
    await card.getByText('Simple', {exact:true}).waitFor();
    assert.equal(await page.getByText('Stale copy', {exact:true}).count(), 0);
    const checkWidth = async label => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label} overflow at ${width}`);
    await card.locator('summary').click();
    await checkWidth('expanded home card');
    if (width === 390 && process.env.SCREENSHOT_DIR) await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR, 'full-forms-home.png'), fullPage:true});
    await card.getByRole('button', {name:'Start Exam'}).click();
    await page.getByText(`Question 1 of ${total}`, {exact:true}).waitFor();
    if (width === 390 && process.env.SCREENSHOT_DIR) await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR, 'full-forms-exam.png'), fullPage:true});
    assert.equal(await page.locator('.palette-btn').count(), total);
    await page.getByRole('button', {name:fullForms.questions[0].options[fullForms.questions[0].correctAnswer], exact:true}).click();
    await page.getByRole('button', {name:`Question ${total}, unanswered`, exact:true}).click();
    await page.getByText(`Question ${total} of ${total}`, {exact:true}).waitFor();
    await checkWidth(`question ${total} and palette`);
    await page.reload();
    await page.getByText(`Question ${total} of ${total}`, {exact:true}).waitFor();
    const last = fullForms.questions.at(-1);
    await page.getByRole('button', {name:last.options[last.correctAnswer], exact:true}).click();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', {name:'Submit Exam', exact:true}).click();
    await page.getByRole('heading', {name:'Exam Result', exact:true}).waitFor();
    assert.equal(await page.locator('.review-card').count(), total);
    await page.getByRole('button', {name:'Correct 2', exact:true}).click();
    assert.equal(await page.locator('.review-card').count(), 2);
    await page.locator('.question-references summary').first().click();
    await page.locator('.question-references summary').last().click();
    assert.ok(await page.getByRole('link', {name:/UP Police Radio Training Centre/}).count() > 0);
    await checkWidth('expanded answer references');
    await page.reload();
    await page.getByRole('heading', {name:'Exam Result', exact:true}).waitFor();
    assert.equal(await page.locator('.question-references').count(), total);
    await page.close();
    console.log(`PASS ${width}px: permanent card, stale-storage upgrade, ${total} questions, recovery, scoring and sources`);
  }
  assert.deepEqual(errors, []);
  await browser.close();
})().catch(error => {console.error(error); process.exit(1);});
