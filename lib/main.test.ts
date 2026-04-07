/** biome-ignore-all lint/style/noNonNullAssertion: the test asserts the Twitter mapping exists before using it */
import { expect, test } from 'vitest';
import { cleanURL } from './main';
import { mappings } from './redirect-mappings';
import { RedirectProvider } from './redirect-provider';

test('main does not add encoding', async () => {
	const input = 'https://example.com/?arg=1&arg=https://yo.com#hash';
	const response = await cleanURL(input);
	expect(response.url).toBe(input);
});

test('twitter example', async () => {
	const input =
		'https://twitter.com/Br_Nowak/status/1586618354307039234?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E1586669502292434944%7Ctwgr%5E2432a774390f7dcbd3b885ac9570cacdb3c48c9d%7Ctwcon%5Es3_&ref_url=https%3A%2F%2Fwww.wprost.pl%2Fpolityka%2F10927933%2Fkuriozalny-wpis-malopolskiej-kurator-oswiaty-przed-1-listopada-internauci-bezlitosni.html';
	const output = await cleanURL(input);
	expect(output).toStrictEqual({
		changes: 2,
		redirect: false,
		url: 'https://twitter.com/Br_Nowak/status/1586618354307039234',
	});
});

test('YouTube Convert', async () => {
	const input = 'https://youtu.be/kPa7bsKwL-c?si=redacted';
	const output = await cleanURL(input);
	expect(output).toStrictEqual({
		changes: 1,
		redirect: false,
		url: 'https://www.youtube.com/watch?v=kPa7bsKwL-c',
		embed_url:
			'https://www.youtube-nocookie.com/embed/kPa7bsKwL-c?mute=1&autoplay=1',
		youtube_id: 'kPa7bsKwL-c',
	});
});

test('YouTube embed_url preserves supported player parameters', async () => {
	const input =
		'https://www.youtube.com/watch?v=kPa7bsKwL-c&controls=0&start=42&end=90&playsinline=1&enablejsapi=1&origin=https%3A%2F%2Fexample.com&widget_referrer=https%3A%2F%2Fwidget.example.com&si=redacted';
	const output = await cleanURL(input);
	expect(output.embed_url).toBe(
		'https://www.youtube-nocookie.com/embed/kPa7bsKwL-c?mute=1&autoplay=1&controls=0&start=42&end=90&playsinline=1&enablejsapi=1&origin=https%3A%2F%2Fexample.com&widget_referrer=https%3A%2F%2Fwidget.example.com',
	);
});

test('YouTube embed_url converts t to start and sets playlist for looping', async () => {
	const input = 'https://youtu.be/kPa7bsKwL-c?t=1m30s&loop=1';
	const output = await cleanURL(input);
	expect(output).toMatchObject({
		url: 'https://www.youtube.com/watch?v=kPa7bsKwL-c&t=1m30s',
		embed_url:
			'https://www.youtube-nocookie.com/embed/kPa7bsKwL-c?mute=1&autoplay=1&loop=1&start=90&playlist=kPa7bsKwL-c',
	});
});

test('RedirectProvider does not report redirect when no instances exist', () => {
	const twitter = mappings.find((mapping) => mapping.name === 'Twitter');
	expect(twitter).toBeDefined();
	const provider = new RedirectProvider(twitter!, [], 'first');
	const input = 'https://twitter.com/user/status/1';
	expect(provider.redirectURL(input)).toStrictEqual({
		url: input,
		changes: 0,
		redirect: false,
	});
});

test('Twitter redirect matcher only matches Twitter and X hosts', () => {
	const twitter = mappings.find((mapping) => mapping.name === 'Twitter');

	expect(twitter).toBeDefined();
	expect(
		new RegExp(twitter!.urlPattern, 'i').test('https://twitter.com/foo'),
	).toBe(true);
	expect(new RegExp(twitter!.urlPattern, 'i').test('https://x.com/foo')).toBe(
		true,
	);
	expect(
		new RegExp(twitter!.urlPattern, 'i').test(
			'https://example.com/?next=x.com',
		),
	).toBe(false);
});
