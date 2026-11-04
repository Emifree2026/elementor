<?php
/**
 * Prune duplicate Media Library attachments for the product images.
 *
 *   php -c tools/php-guard.ini scripts/prune-duplicate-media.php [--dry-run]
 *
 * WordPress appends `-1`, `-2`, … to an uploaded filename when the name
 * is taken, and it derives the attachment `post_name` from the post
 * TITLE, not from the filename. A lookup by filename therefore finds
 * nothing, and a re-upload creates a second copy of every asset instead
 * of reusing the first one.
 *
 * This script groups the attachments of the product images by the file
 * they point at and keeps the OLDEST one (the original upload), then
 * deletes the later copies together with their generated sizes.
 *
 * The list of product assets is read from the same source as
 * scripts/sideload-product-media.php — keep them in sync.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$emifree_dry_run = in_array( '--dry-run', $argv, true );

/**
 * The product assets: logical key => relative path in the theme.
 *
 * Mirrors $emifree_media in scripts/sideload-product-media.php.
 */
$emifree_files = array(
	'assets/products/mechanical/eco_air_final.png',
	'assets/products/fotom1-gallery.webp',
	'assets/products/fotom5-gallery.webp',
	'assets/products/fotom6-gallery.webp',
	'assets/products/mechanical/dimension-1.webp',
	'assets/products/mechanical/dimension-2.webp',
	'assets/products/mechanical/dimension-3.webp',
	'assets/products/mechanical/dimension-4-en.webp',
	'assets/products/mechanical/performance-1200-en.png',
	'assets/products/mechanical/performance-1500-en.png',
	'assets/products/electrostatic/earia_final.png',
	'assets/products/fotoe1.webp',
	'assets/products/fotoe2.webp',
	'assets/products/fotoe3.webp',
	'assets/products/electrostatic/earia-dim-1.jpg',
	'assets/products/electrostatic/earia-dim-2.jpg',
	'assets/products/electrostatic/earia-dim-3-en.jpg',
	'assets/products/electrostatic/earia-performance-en.png',
	'assets/products/dust/dust-1.webp',
	'assets/products/dust/dust-2.webp',
	'assets/products/dust/dust-3.webp',
	// German variants.
	'assets/products/mechanical/dimension-4-de.webp',
	'assets/products/mechanical/performance-1200-de.png',
	'assets/products/mechanical/performance-1500-de.png',
	'assets/products/electrostatic/earia-dim-3-de.jpg',
	'assets/products/electrostatic/earia-performance-de.png',
);

$emifree_deleted = 0;
$emifree_kept    = 0;

foreach ( $emifree_files as $emifree_rel ) {
	$emifree_basename = basename( $emifree_rel );
	$emifree_stem     = pathinfo( $emifree_basename, PATHINFO_FILENAME );
	$emifree_ext      = pathinfo( $emifree_basename, PATHINFO_EXTENSION );

	// Every attachment whose file matches this asset: the original name,
	// the "-1", "-2", … copies WordPress makes when a name is taken, and
	// the "-scaled" variant of a big image.
	//
	// NOTE: WP_Meta_Query adds the LIKE wildcards itself and escapes any
	// that are in the value, so the value must NOT contain "%". A value of
	// "stem.ext" becomes "%stem.ext%"; a value of "stem-" becomes
	// "%stem-%", which is what catches every "-1", "-2", "-scaled" copy.
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
					'value'   => $emifree_stem.'-',
					'compare' => 'LIKE',
				),
			),
		)
	);

	$emifree_ids = array_map( 'intval', $emifree_ids );
	sort( $emifree_ids );

	if ( ! $emifree_ids ) {
		printf( "missing  %s\n", $emifree_rel );
		continue;
	}

	// Keep the oldest — the first upload — and drop the copies.
	$emifree_keep = (int) $emifree_ids[0];
	$emifree_kept++;

	printf(
		"keep     %-52s #%d  (%d candidate(s))\n",
		$emifree_rel,
		$emifree_keep,
		count( $emifree_ids )
	);

	foreach ( array_slice( $emifree_ids, 1 ) as $emifree_id ) {
		if ( $emifree_dry_run ) {
			printf( "  WOULD DELETE  #%d\n", $emifree_id );
			continue;
		}
		wp_delete_attachment( (int) $emifree_id, true );
		printf( "  deleted #%d\n", $emifree_id );
		$emifree_deleted++;
	}
}

printf(
	"\n%s — kept %d attachment(s), %s %d duplicate(s)\n",
	$emifree_dry_run ? 'DRY RUN' : 'DONE',
	$emifree_kept,
	$emifree_dry_run ? 'would delete' : 'deleted',
	$emifree_deleted
);
