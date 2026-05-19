const HOMEPAGE_TITLE = 'Frank & co. | Natural Diamond Jewellery, Fashion Collections, and Gifts';

async function isPageValid(page) {
  const title = await page.title().catch(() => '');
  const titleLower = title.toLowerCase();
  const errorTitles = ['404', '500', '503', 'error', 'server error', 'something went wrong', 'page not found'];
  const hasErrorTitle = errorTitles.some(function(e) { return titleLower.startsWith(e) || titleLower.includes(e); });
  return title !== '' && title !== HOMEPAGE_TITLE && !hasErrorTitle;
}

module.exports = { isPageValid, HOMEPAGE_TITLE };
