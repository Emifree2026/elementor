<?php
/**
 * Dump the Elementor + template state of the product page rows.
 *
 *   php scripts/probe-elementor-docs.php
 *
 * Read-only. Answers the question the route wiring depends on: for each
 * product page row, is there an Elementor document attached, and does the
 * row carry the PHP shim template?
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$ids = array( 42, 43, 44, 45, 46, 47, 48, 49, 72, 135, 157 );

printf( "%-5s %-42s %-9s %-28s %-9s %-9s %s\n",
	'ID', 'post_name', 'status', '_wp_page_template', 'editmode', 'data_len', 'css' );

foreach ( $ids as $id ) {
	$post = get_post( $id );
	if ( ! $post ) {
		printf( "%-5s (missing)\n", $id );
		continue;
	}

	$template = get_post_meta( $id, '_wp_page_template', true );
	$editmode = get_post_meta( $id, '_elementor_edit_mode', true );
	$data     = get_post_meta( $id, '_elementor_data', true );
	$css      = get_post_meta( $id, '_elementor_css', true );

	$data_len = is_string( $data ) ? strlen( $data ) : ( is_array( $data ) ? count( $data ) : 0 );

	if ( is_string( $css ) && '' !== $css ) {
		$css_state = 'yes';
	} elseif ( is_array( $css ) ) {
		$css_state = 'arr:' . count( $css );
	} else {
		$css_state = 'no';
	}

	printf( "%-5s %-42s %-9s %-28s %-9s %-9s %s\n",
		$id,
		substr( $post->post_name, 0, 42 ),
		$post->post_status,
		$template ? substr( $template, 0, 28 ) : '(default)',
		$editmode ? $editmode : '-',
		$data_len,
		$css_state
	);
}

echo "\n=== Elementor document ids referenced by the bridge / shortcodes ===\n";
foreach ( array( 'emifree_elementor_doc_id', 'emifree_elementor_docs' ) as $option ) {
	$value = get_option( $option, null );
	printf( "option %-28s : %s\n", $option, null === $value ? '(not set)' : wp_json_encode( $value ) );
}

echo "\n=== active theme ===\n";
echo wp_get_theme()->get( 'Name' ) . ' ' . wp_get_theme()->get( 'Version' ) . "\n";
echo 'Elementor: ' . ( defined( 'ELEMENTOR_VERSION' ) ? ELEMENTOR_VERSION : 'not loaded' ) . "\n";
