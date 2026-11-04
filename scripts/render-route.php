<?php
/**
 * Render the live product-page partials and report every theme-asset URL
 * they emit, flagged when the file is missing on disk.
 *
 *   php -c tools/php-guard.ini scripts/render-route.php
 *
 * The partials are self-contained (they only need ABSPATH and the theme's
 * helpers), so they can be rendered without a full page request.
 *
 * Read-only: it renders the markup, it does not modify anything.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$root = 'C:/Users/vpedr/Local Sites/landingwptest/app/public';
$dir  = get_template_directory();

$parts = array(
	'mechanical'    => array(
		'en' => 'template-parts/page-products-mechanical.php',
		'de' => 'template-parts/page-products-mechanical-de.php',
	),
	'electrostatic' => array(
		'en' => 'template-parts/page-products-electrostatic.php',
		'de' => 'template-parts/page-products-electrostatic-de.php',
	),
	'dust'          => array(
		'en' => 'template-parts/page-products-dust.php',
		'de' => 'template-parts/page-products-dust-de.php',
	),
);

$total_missing = 0;
$total_bad_quote = 0;

// The two whitelists that gate the ?quote=<slug> contact prefill.
//   - emifree_contact_prefill_messages() is what contact.js reads.
//   - The server-side allowed list is a literal array in functions.php.
$prefill_keys = array_keys( emifree_contact_prefill_messages() );
$server_allowed = array( 'mechanical', 'electrostatic', 'dust' );

if ( $prefill_keys !== $server_allowed ) {
	printf(
		"WARNING: the JS prefill whitelist and the server-side allowed list differ.\n"
		. "  JS     : %s\n  server : %s\n",
		implode( ', ', $prefill_keys ),
		implode( ', ', $server_allowed )
	);
}

foreach ( $parts as $slug => $langs ) {
	foreach ( $langs as $lang => $file ) {
		$path = $dir . '/' . $file;

		ob_start();
		include $path;
		$html = ob_get_clean();

		preg_match_all(
			'#(?:src|href|data-src)=["\']([^"\']*?/wp-content/themes/emifree-landing/assets/[^"\']+)["\']#i',
			$html,
			$matches
		);

		$missing = array();
		$seen    = array();
		foreach ( $matches[1] as $url ) {
			$rel = wp_parse_url( $url, PHP_URL_PATH );
			if ( ! $rel || isset( $seen[ $rel ] ) ) {
				continue;
			}
			$seen[ $rel ] = true;
			if ( ! file_exists( $root . $rel ) ) {
				$missing[] = $rel;
			}
		}

		// Contact prefill: every ?quote=<slug> the page emits must be a
		// product key the contact form accepts, and must have an entry
		// for this page's language.
		preg_match_all( '#quote=([a-z0-9-]+)#i', $html, $quote_matches );
		$bad_quotes = array();
		foreach ( array_unique( $quote_matches[1] ) as $quote_slug ) {
			if ( ! in_array( $quote_slug, $prefill_keys, true ) ) {
				$bad_quotes[] = sprintf( '%s (not whitelisted)', $quote_slug );
			} elseif ( ! isset( emifree_contact_prefill_messages()[ $quote_slug ][ $lang ] ) ) {
				$bad_quotes[] = sprintf( '%s (no "%s" message)', $quote_slug, $lang );
			}
		}

		$total_missing += count( $missing );
		$total_bad_quote += count( $bad_quotes );

		printf( "\n=== %s (%s) ===\n", $slug, $lang );
		printf( "partial         : %s\n", $file );
		printf( "bytes           : %d\n", strlen( $html ) );
		printf( "theme assets    : %d referenced, %d missing on disk\n", count( $seen ), count( $missing ) );
		foreach ( $missing as $rel ) {
			printf( "  MISSING  %s\n", $rel );
		}
		printf( "quote prefill   : %d slug(s), %d unusable\n", count( array_unique( $quote_matches[1] ) ), count( $bad_quotes ) );
		foreach ( $bad_quotes as $bad ) {
			printf( "  BAD QUOTE  %s\n", $bad );
		}
	}
}

printf( "\n---------------------------------------------\n" );
printf( "%s  (%d missing asset reference(s), %d unusable quote prefill(s))\n",
	( $total_missing || $total_bad_quote ) ? 'BROKEN' : 'OK',
	$total_missing,
	$total_bad_quote
);
