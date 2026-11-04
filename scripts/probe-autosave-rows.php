<?php
/**
 * Find the autosave / revision rows a build-composition call may have staged.
 *
 *   php probe-autosave-rows.php [post_id ...]
 *
 * Elementor's atomic editor stages MCP writes into an autosave row; the
 * publish-document ability promotes it. This dumps every row whose parent is
 * the given post, whatever its type, plus any row whose post_name looks like
 * an autosave of the post.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

global $wpdb;

$emifree_ids = array_slice( $argv, 1 );
if ( ! $emifree_ids ) {
	$emifree_ids = array( 44, 45 );
}

foreach ( $emifree_ids as $emifree_id ) {
	$emifree_id = (int) $emifree_id;
	printf( "=== post %d\n", $emifree_id );

	$emifree_rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT ID, post_type, post_status, post_parent, post_name, post_date,
			        LENGTH(post_content) AS len
			 FROM {$wpdb->posts}
			 WHERE post_parent = %d
			 ORDER BY ID DESC",
			$emifree_id
		)
	);
	if ( ! $emifree_rows ) {
		echo "    (no child rows)\n";
	}
	foreach ( $emifree_rows as $emifree_row ) {
		printf(
			"    %-18s id=%-6d status=%-9s name=%-28s len=%d\n",
			$emifree_row->post_type,
			$emifree_row->ID,
			$emifree_row->post_status,
			$emifree_row->post_name,
			$emifree_row->len
		);

		$emifree_meta = get_post_meta( $emifree_row->ID );
		foreach ( $emifree_meta as $emifree_key => $emifree_values ) {
			foreach ( $emifree_values as $emifree_value ) {
				$emifree_len = is_string( $emifree_value ) ? strlen( $emifree_value ) : 0;
				if ( $emifree_len > 200 ) {
					printf( "        %-34s %d bytes\n", $emifree_key, $emifree_len );
				}
			}
		}
	}

	// The meta on the main post.
	$emifree_main = get_post_meta( $emifree_id );
	foreach ( $emifree_main as $emifree_key => $emifree_values ) {
		foreach ( $emifree_values as $emifree_value ) {
			$emifree_len = is_string( $emifree_value ) ? strlen( $emifree_value ) : 0;
			printf( "    main %-28s %d bytes\n", $emifree_key, $emifree_len );
		}
	}

	echo "\n";
}
