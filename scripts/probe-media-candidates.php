<?php
/**
 * Inspect the candidate attachments for a few product assets.
 *
 *   php -c tools/php-guard.ini scripts/probe-media-candidates.php
 *
 * The prune script keeps the OLDEST attachment per asset. For two assets
 * that oldest one is an id the media manifest does not point at, so this
 * probe prints the full facts: file, size, mtime, title, and whether any
 * post or Elementor document references the id.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$emifree_basenames = array( 'eco_air_final.png', 'fotoe2.webp' );

foreach ( $emifree_basenames as $emifree_basename ) {
	$emifree_stem = pathinfo( $emifree_basename, PATHINFO_FILENAME );

	echo "\n=== {$emifree_basename} ===\n";

	$emifree_ids = get_posts(
		array(
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => 50,
			'no_found_rows'  => true,
			'fields'         => 'ids',
			'orderby'        => 'ID',
			'order'          => 'ASC',
			'meta_query'     => array(
				'relation' => 'OR',
				array(
					'key'     => '_wp_attached_file',
					'value'   => $emifree_basename,
					'compare' => 'LIKE',
				),
				array(
					'key'     => '_wp_attached_file',
					'value'   => $emifree_stem . '-',
					'compare' => 'LIKE',
				),
			),
		)
	);

	foreach ( $emifree_ids as $emifree_id ) {
		$emifree_id   = (int) $emifree_id;
		$emifree_file = get_attached_file( $emifree_id );
		$emifree_meta = wp_get_attachment_metadata( $emifree_id );
		$emifree_post = get_post( $emifree_id );

		printf(
			"#%-4d %-52s %8s bytes  mtime=%s\n",
			$emifree_id,
			$emifree_file ? basename( $emifree_file ) : '(no file)',
			$emifree_file && file_exists( $emifree_file ) ? filesize( $emifree_file ) : '?',
			$emifree_file && file_exists( $emifree_file ) ? gmdate( 'Y-m-d H:i:s', filemtime( $emifree_file ) ) : '?'
		);
		printf(
			"       post_name=%-40s title=%s\n",
			$emifree_post->post_name,
			$emifree_post->post_title
		);
		printf(
			"       alt=%s\n",
			(string) get_post_meta( $emifree_id, '_wp_attachment_image_alt', true )
		);

		// Who references this id? post_content, _elementor_data, meta.
		$emifree_refs = array();

		$emifree_by_content = get_posts(
			array(
				'post_type'      => 'any',
				'post_status'    => 'any',
				'posts_per_page' => 20,
				'no_found_rows'  => true,
				'fields'         => 'ids',
				's'              => '"id":' . $emifree_id . ',',
			)
		);
		if ( $emifree_by_content ) {
			$emifree_refs[] = 'post_content: ' . implode( ',', $emifree_by_content );
		}

		foreach ( array( '_elementor_data', '_thumbnail_id', '_elementor_element_cache' ) as $emifree_key ) {
			$emifree_hits = get_posts(
				array(
					'post_type'      => 'any',
					'post_status'    => 'any',
					'posts_per_page' => 20,
					'no_found_rows'  => true,
					'fields'         => 'ids',
					'meta_query'     => array(
						array(
							'key'     => $emifree_key,
							'value'   => $emifree_id,
							'compare' => 'LIKE',
						),
					),
				)
			);
			if ( $emifree_hits ) {
				$emifree_refs[] = $emifree_key . ': ' . implode( ',', $emifree_hits );
			}
		}

		printf( "       refs => %s\n", $emifree_refs ? implode( ' | ', $emifree_refs ) : '(none)' );
	}
}
