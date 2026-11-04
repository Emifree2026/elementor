<?php
/**
 * Dump the Elementor-related post meta keys and sizes for a post.
 *
 *   php probe-meta.php [post_id]
 *
 * The atomic (V4) document keeps its CSS in a separate meta key from the
 * element tree, so a backup that only captures `_elementor_data` is not a
 * complete restore point. This shows exactly which keys exist and how big
 * they are, so the backup script can be checked against the real storage
 * layout.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$emifree_post_id = isset( $argv[1] ) ? (int) $argv[1] : 72;

$emifree_all = get_post_meta( $emifree_post_id );
ksort( $emifree_all );

printf( "post %d — meta keys\n", $emifree_post_id );
foreach ( $emifree_all as $emifree_key => $emifree_values ) {
	foreach ( $emifree_values as $emifree_value ) {
		$emifree_len = is_string( $emifree_value ) ? strlen( $emifree_value ) : 0;
		$emifree_head = is_string( $emifree_value ) ? substr( $emifree_value, 0, 90 ) : '(not a string)';
		printf( "  %-34s %9d bytes  %s\n", $emifree_key, $emifree_len, $emifree_head );
	}
}

// Is the atomic style map a separate meta key, or is it inside _elementor_data?
$emifree_raw = get_post_meta( $emifree_post_id, '_elementor_data', true );
$emifree_decoded = is_string( $emifree_raw ) ? json_decode( $emifree_raw, true ) : $emifree_raw;

echo "\n_elementor_data decoded: " . gettype( $emifree_decoded ) . "\n";
if ( is_array( $emifree_decoded ) ) {
	if ( array_is_list( $emifree_decoded ) ) {
		echo "  list of " . count( $emifree_decoded ) . " root elements\n";
	} else {
		echo "  keys: " . implode( ', ', array_keys( $emifree_decoded ) ) . "\n";
		foreach ( $emifree_decoded as $emifree_k => $emifree_v ) {
			echo "    $emifree_k => " . ( is_array( $emifree_v ) ? 'array(' . count( $emifree_v ) . ')' : gettype( $emifree_v ) ) . "\n";
		}
	}
}
