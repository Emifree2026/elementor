<?php
/**
 * Inspect the Elementor state of the product pages.
 *
 *   php probe-elementor-state.php [post_id ...]
 *
 * Shows, per post: the Elementor meta keys, whether the post is marked as
 * built with Elementor, and any autosave / revision rows that the MCP
 * build-composition ability may have staged into.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$emifree_ids = array_slice( $argv, 1 );
if ( ! $emifree_ids ) {
	$emifree_ids = array( 44, 45, 46, 47, 48, 49, 72 );
}

global $wpdb;

foreach ( $emifree_ids as $emifree_id ) {
	$emifree_id = (int) $emifree_id;
	$emifree_post = get_post( $emifree_id );

	printf( "=== post %d  %s\n", $emifree_id, $emifree_post ? $emifree_post->post_name : '(missing)' );

	if ( ! $emifree_post ) {
		continue;
	}

	printf( "    status          : %s\n", $emifree_post->post_status );
	printf( "    _edit_mode      : %s\n", get_post_meta( $emifree_id, '_elementor_edit_mode', true ) ?: '(none)' );
	printf( "    _template_type  : %s\n", get_post_meta( $emifree_id, '_elementor_template_type', true ) ?: '(none)' );
	printf( "    _wp_page_template: %s\n", get_post_meta( $emifree_id, '_wp_page_template', true ) ?: '(none)' );

	$emifree_data = get_post_meta( $emifree_id, '_elementor_data', true );
	printf( "    _elementor_data : %d bytes\n", is_string( $emifree_data ) ? strlen( $emifree_data ) : 0 );

	$emifree_decoded = is_string( $emifree_data ) ? json_decode( $emifree_data, true ) : null;
	if ( is_array( $emifree_decoded ) && array_is_list( $emifree_decoded ) ) {
		printf( "    root elements   : %d\n", count( $emifree_decoded ) );
	}

	// Autosave + revision rows that might hold a staged composition.
	$emifree_rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT ID, post_type, post_status, post_parent, post_name, LENGTH(post_content) AS len
			 FROM {$wpdb->posts}
			WHERE post_parent = %d AND post_type IN ('revision','elementor_library')
			ORDER BY ID DESC
			LIMIT 8",
			$emifree_id
		)
	);
	foreach ( $emifree_rows as $emifree_row ) {
		printf(
			"    %-8s id=%-6d status=%-9s name=%-24s len=%d\n",
			$emifree_row->post_type,
			$emifree_row->ID,
			$emifree_row->post_status,
			$emifree_row->post_name,
			$emifree_row->len
		);
	}

	// The atomic editor's own revision type.
	$emifree_atomic = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT ID, post_status, post_name, LENGTH(post_content) AS len
			 FROM {$wpdb->posts}
			WHERE post_parent = %d AND post_type LIKE 'elementor%'
			ORDER BY ID DESC
			LIMIT 8",
			$emifree_id
		)
	);
	foreach ( $emifree_atomic as $emifree_row ) {
		printf(
			"    atomic   id=%-6d status=%-9s name=%-24s len=%d\n",
			$emifree_row->ID,
			$emifree_row->post_status,
			$emifree_row->post_name,
			$emifree_row->len
		);
	}

	echo "\n";
}
