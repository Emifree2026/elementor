<?php
/**
 * Reconcile the Media Library against the theme's product images.
 *
 *   php -c tools/php-guard.ini scripts/reconcile-product-media.php [--apply]
 *
 * WordPress appends `-1`, `-2`, … to an uploaded filename when the name is
 * taken, and it derives the attachment `post_name` from the post TITLE, not
 * from the filename. A lookup by filename therefore finds nothing, and a
 * re-upload creates a second copy of every asset instead of reusing the
 * first one.
 *
 * Deleting by filename is not safe either: the landing page itself has
 * assets that happen to share a basename with a product image (the ECO AIR
 * wordmark, the EARIA gallery shot). Those are referenced by posts 72/135
 * and must survive.
 *
 * So the rule here is CONTENT, not name and not age:
 *
 *   source hash == attachment hash   -> it is the same image. Keep the
 *                                        oldest such attachment, delete the
 *                                        rest.
 *   source hash != attachment hash   -> a different image that merely
 *                                        shares a name. Never touched.
 *
 * With --apply the duplicates are deleted; without it the script only
 * reports what it would do.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$emifree_apply = in_array( '--apply', $argv, true );
$emifree_theme = get_template_directory();

/**
 * The product assets: relative path in the theme.
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

/**
 * Attachments whose file name matches this asset: the original name, the
 * "-1", "-2", … copies WordPress makes when a name is taken, and the
 * "-scaled" variant of a big image.
 *
 * NOTE: WP_Meta_Query adds the LIKE wildcards itself and escapes any that
 * are in the value, so the value must NOT contain "%". A value of
 * "stem.ext" becomes "%stem.ext%"; a value of "stem-" becomes "%stem-%",
 * which is what catches every "-1", "-2", "-scaled" copy.
 */
function emifree_media_candidates( $emifree_basename ) {
	$emifree_stem = pathinfo( $emifree_basename, PATHINFO_FILENAME );

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

	$emifree_ids = array_map( 'intval', $emifree_ids );
	sort( $emifree_ids );

	return $emifree_ids;
}

/**
 * The posts and documents that reference an attachment id.
 */
function emifree_media_refs( $emifree_id ) {
	$emifree_refs = array();

	foreach ( array( '_elementor_data', '_thumbnail_id' ) as $emifree_key ) {
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
			$emifree_refs[ $emifree_key ] = $emifree_hits;
		}
	}

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
		$emifree_refs['post_content'] = $emifree_by_content;
	}

	return $emifree_refs;
}

$emifree_kept     = array();
$emifree_to_delete = array();
$emifree_touched  = array();

foreach ( $emifree_files as $emifree_rel ) {
	$emifree_src = $emifree_theme . '/' . $emifree_rel;

	if ( ! file_exists( $emifree_src ) ) {
		printf( "MISSING  %s\n", $emifree_rel );
		continue;
	}

	$emifree_basename = basename( $emifree_src );
	$emifree_hash     = sha1_file( $emifree_src );
	$emifree_ids      = emifree_media_candidates( $emifree_basename );

	$emifree_same = array();

	foreach ( $emifree_ids as $emifree_id ) {
		$emifree_file = get_attached_file( $emifree_id );
		if ( ! $emifree_file || ! file_exists( $emifree_file ) ) {
			printf(
				"  #%-4d %-46s NO FILE ON DISK%s\n",
				$emifree_id,
				$emifree_file ? basename( $emifree_file ) : '(unresolved)',
				''
			);
			continue;
		}

		if ( sha1_file( $emifree_file ) === $emifree_hash ) {
			$emifree_same[] = $emifree_id;
			printf(
				"  #%-4d %-46s SAME   %s\n",
				$emifree_id,
				basename( $emifree_file ),
				$emifree_file
			);
		} else {
			$emifree_refs = emifree_media_refs( $emifree_id );
			printf(
				"  #%-4d %-46s OTHER  %s  refs=%s\n",
				$emifree_id,
				basename( $emifree_file ),
				$emifree_file,
				$emifree_refs ? wp_json_encode( $emifree_refs ) : 'none'
			);
		}
	}

	if ( ! $emifree_same ) {
		printf( "  -> NO MATCH for %s (needs upload)\n", $emifree_rel );
		continue;
	}

	// Keep the oldest of the identical ones — that is the original upload.
	$emifree_keeper = (int) $emifree_same[0];
	$emifree_kept[ $emifree_rel ] = $emifree_keeper;

	foreach ( array_slice( $emifree_same, 1 ) as $emifree_id ) {
		$emifree_refs      = emifree_media_refs( $emifree_id );
		$emifree_to_delete[] = array(
			'id'    => (int) $emifree_id,
			'rel'   => $emifree_rel,
			'refs'  => $emifree_refs,
		);
	}
}

echo "\n" . str_repeat( '-', 78 ) . "\n";
printf( "keeper for %d asset(s)\n", count( $emifree_kept ) );
foreach ( $emifree_kept as $emifree_rel => $emifree_id ) {
	printf( "  %-52s #%d\n", $emifree_rel, $emifree_id );
}

printf( "\n%d duplicate(s) %s\n", count( $emifree_to_delete ), $emifree_apply ? 'to delete' : 'to delete' );

foreach ( $emifree_to_delete as $emifree_row ) {
	printf(
		"  #%-4d %-52s refs=%s\n",
		$emifree_row['id'],
		$emifree_row['rel'],
		$emifree_row['refs'] ? wp_json_encode( $emifree_row['refs'] ) : 'none'
	);
}

if ( ! $emifree_apply ) {
	echo "\nDRY RUN — pass --apply to delete.\n";
	return;
}

$emifree_deleted = 0;
foreach ( $emifree_to_delete as $emifree_row ) {
	if ( $emifree_row['refs'] ) {
		printf(
			"  SKIPPED #%d — still referenced by %s\n",
			$emifree_row['id'],
			wp_json_encode( $emifree_row['refs'] )
		);
		continue;
	}
	wp_delete_attachment( (int) $emifree_row['id'], true );
	printf( "  deleted #%d\n", $emifree_row['id'] );
	$emifree_deleted++;
}

printf( "\nDONE — deleted %d duplicate(s)\n", $emifree_deleted );

file_put_contents(
	'C:/Users/vpedr/Projects/emifree-elementor/pipeline/src/media-keepers.json',
	wp_json_encode( $emifree_kept, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
);
echo "keepers -> pipeline/src/media-keepers.json\n";
