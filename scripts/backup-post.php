<?php
/**
 * Back up an Elementor document: the raw `_elementor_data` tree plus the generated CSS files.
 *
 *   php backup-post.php <post_id> <out_dir>
 *
 * Fixes two bugs in the previous version:
 *   1. `_elementor_css` is not always a string — Elementor may store it as an array of file
 *      handles. Reading it as a string raised "Array to string conversion" and aborted the CSS copy.
 *      It is handled as "string OR array" here, and the CSS files are found by globbing the
 *      uploads directory instead of trusting the meta value.
 *   2. The generated CSS files are named `local-<post_id>-frontend-<breakpoint>.css`, NOT
 *      `post-<css_id>.css`. The old script looked for the wrong pattern and copied nothing.
 *
 * This script only READS. It never touches `_elementor_element_cache` or `_elementor_css`.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$post_id = (int) ( $argv[1] ?? 0 );
$out_dir = rtrim( $argv[2] ?? '.', '/' );

if ( ! $post_id ) {
	fwrite( STDERR, "usage: php backup-post.php <post_id> <out_dir>\n" );
	exit( 1 );
}

if ( ! is_dir( $out_dir ) ) {
	mkdir( $out_dir, 0777, true );
}

$stamp = gmdate( 'Ymd-His' );
$raw   = get_post_meta( $post_id, '_elementor_data', true );

if ( ! $raw ) {
	fwrite( STDERR, "post {$post_id} has no _elementor_data\n" );
	exit( 1 );
}

$file = "{$out_dir}/post-{$post_id}-elementor-{$stamp}.json";
file_put_contents( $file, $raw );

$tree = json_decode( $raw, true );
$top  = is_array( $tree ) ? count( $tree ) : 0;

printf( "saved _elementor_data -> %s (%d bytes, %d top-level elements)\n", $file, strlen( $raw ), $top );

// The meta value may be a string or an array depending on Elementor's state; report both safely.
$css_meta = get_post_meta( $post_id, '_elementor_css', true );
$css_desc = is_array( $css_meta )
	? 'array[' . implode( ',', $css_meta ) . ']'
	: ( is_string( $css_meta ) && '' !== $css_meta ? $css_meta : '(empty)' );
echo "elementor css meta    -> {$css_desc}\n";

// Generated CSS lives in uploads/elementor/css as local-<post_id>-frontend-<breakpoint>.css
$css_dir = WP_CONTENT_DIR . '/uploads/elementor/css';
$found   = glob( $css_dir . "/local-{$post_id}-frontend-*.css" ) ?: array();

if ( ! $found ) {
	echo "saved css            -> none found in {$css_dir}\n";
	exit( 0 );
}

foreach ( $found as $src ) {
	$dest = "{$out_dir}/post-{$post_id}-" . basename( $src );
	copy( $src, $dest );
	printf( "saved css            -> %s (%d bytes)\n", $dest, filesize( $dest ) );
}
