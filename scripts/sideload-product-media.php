<?php
/**
 * Sideload the product-page images from the theme into the Media Library.
 *
 *   php sideload-product-media.php [--manifest out.json]
 *
 * Every image the three product pages use currently lives as a plain file in
 * the theme (`get_template_directory_uri() . '/assets/…'`) and has no WordPress
 * attachment. An Elementor `e-image` widget can point at an external URL, but
 * then the image is not an editable asset and the marketing team cannot swap
 * it. Sideloading gives every file a real attachment id, which is what the
 * atomic image widget wants:
 *
 *   { "src": { "id": 123 }, "size": "full" }
 *
 * The script is idempotent: an attachment that already points at the same
 * source file is reused rather than uploaded twice. It prints a JSON manifest
 * keyed by the logical name used in the product-page content module.
 *
 * Alt text comes from the template copy, so the Media Library carries it too.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

/**
 * The media manifest: logical key => [relative path in the theme, alt text].
 *
 * Mirrors the gallery / dimension / performance arrays in
 * inc/products-page-helpers.php and the <img> tags in
 * template-parts/page-products-*.php.
 */
$emifree_media = array(
	// --- Mechanical: ECO AIR Cleaner -------------------------------------
	'mech-logo'          => array( 'assets/products/mechanical/eco_air_final.png', 'ECO AIR Cleaner wordmark' ),
	'mech-gallery-1'     => array( 'assets/products/fotom1-gallery.webp', 'ECO AIR Cleaner, side view' ),
	'mech-gallery-2'     => array( 'assets/products/fotom5-gallery.webp', 'ECO AIR Cleaner, control panel' ),
	'mech-gallery-3'     => array( 'assets/products/fotom6-gallery.webp', 'ECO AIR Cleaner, installed' ),
	'mech-dimension-1'   => array( 'assets/products/mechanical/dimension-1.webp', 'ECO AIR dimensions, view 1' ),
	'mech-dimension-2'   => array( 'assets/products/mechanical/dimension-2.webp', 'ECO AIR dimensions, view 2' ),
	'mech-dimension-3'   => array( 'assets/products/mechanical/dimension-3.webp', 'ECO AIR dimensions, view 3' ),
	'mech-dimension-4'   => array( 'assets/products/mechanical/dimension-4-en.webp', 'ECO AIR enclosure with analog differential pressure indicator callout' ),
	'mech-performance-1' => array( 'assets/products/mechanical/performance-1200-en.png', 'ECO AIR Cleaner performance curve, 1200 m³/h variant' ),
	'mech-performance-2' => array( 'assets/products/mechanical/performance-1500-en.png', 'ECO AIR Cleaner performance curve, 1500 m³/h variant' ),

	// --- Electrostatic: EARIA 1000 m³/h ----------------------------------
	'elec-logo'          => array( 'assets/products/electrostatic/earia_final.png', 'EARIA wordmark' ),
	'elec-gallery-1'     => array( 'assets/products/fotoe1.webp', 'EARIA electrostatic precipitator, front view' ),
	'elec-gallery-2'     => array( 'assets/products/fotoe2.webp', 'EARIA electrostatic precipitator, side with hinged door open' ),
	'elec-gallery-3'     => array( 'assets/products/fotoe3.webp', 'EARIA electrostatic precipitator, hinge detail' ),
	'elec-dimension-1'   => array( 'assets/products/electrostatic/earia-dim-1.jpg', 'EARIA dimensions, view 1 — side elevation' ),
	'elec-dimension-2'   => array( 'assets/products/electrostatic/earia-dim-2.jpg', 'EARIA dimensions, view 2 — front view' ),
	'elec-dimension-3'   => array( 'assets/products/electrostatic/earia-dim-3-en.jpg', 'EARIA dimensions, view 3 — mounting view, 6 × M10 fasteners' ),
	'elec-performance-1' => array( 'assets/products/electrostatic/earia-performance-en.png', 'Performance comparison: Emifree System with self-cleaning vs. conventional system over time' ),

	// --- Dust -------------------------------------------------------------
	'dust-gallery-1'     => array( 'assets/products/dust/dust-1.webp', 'Emifree dust filtration unit, three-quarter view with control panel and extraction arm' ),
	'dust-gallery-2'     => array( 'assets/products/dust/dust-2.webp', 'Emifree dust filtration unit, full cabinet view with side ducting and collection bin' ),
	'dust-gallery-3'     => array( 'assets/products/dust/dust-3.webp', 'Emifree dust filtration unit, front view with integrated cyclone and warning beacon' ),
);

$emifree_theme_dir = get_template_directory();
$emifree_uploads   = wp_upload_dir();
$emifree_manifest  = array();

foreach ( $emifree_media as $emifree_key => $emifree_item ) {
	list( $emifree_rel, $emifree_alt ) = $emifree_item;
	$emifree_src = $emifree_theme_dir . '/' . $emifree_rel;

	if ( ! file_exists( $emifree_src ) ) {
		fwrite( STDERR, "MISSING  {$emifree_key}: {$emifree_rel}\n" );
		continue;
	}

	$emifree_basename = basename( $emifree_src );

	// Reuse an existing attachment that already serves this exact file.
	$emifree_existing = get_posts(
		array(
			'post_type'      => 'attachment',
			'name'           => sanitize_title( pathinfo( $emifree_basename, PATHINFO_FILENAME ) ),
			'post_status'    => 'inherit',
			'posts_per_page' => 1,
			'fields'         => 'ids',
		)
	);

	$emifree_id = 0;
	if ( $emifree_existing ) {
		$emifree_id = (int) $emifree_existing[0];
		$emifree_file = get_attached_file( $emifree_id );
		// Only reuse when the file is really the same asset.
		if ( ! $emifree_file || ! file_exists( $emifree_file ) || basename( $emifree_file ) !== $emifree_basename ) {
			$emifree_id = 0;
		}
	}

	if ( $emifree_id ) {
		echo "reused  {$emifree_key} -> #{$emifree_id}\n";
	} else {
		/*
		 * media_sideload_image() wants a URL; the assets live on disk, so
		 * media_handle_sideload() with a file array is the right call. Its
		 * 'tmp_name' is the source path, and 'name' is the target filename.
		 */
		$emifree_id = media_handle_sideload(
			array(
				'name'     => $emifree_basename,
				'tmp_name' => $emifree_src,
			),
			0,
			$emifree_alt,
			array(
				'post_title' => $emifree_alt,
			)
		);

		if ( is_wp_error( $emifree_id ) ) {
			fwrite( STDERR, "FAILED  {$emifree_key}: " . $emifree_id->get_error_message() . "\n" );
			continue;
		}
		echo "uploaded {$emifree_key} -> #{$emifree_id}\n";
	}

	// Alt text lives on the attachment so the Elementor image widget can use it.
	update_post_meta( $emifree_id, '_wp_attachment_image_alt', $emifree_alt );

	$emifree_meta = wp_get_attachment_metadata( $emifree_id );
	$emifree_manifest[ $emifree_key ] = array(
		'id'    => (int) $emifree_id,
		'url'   => wp_get_attachment_url( $emifree_id ),
		'alt'   => $emifree_alt,
		'width' => $emifree_meta['width'] ?? null,
		'height' => $emifree_meta['height'] ?? null,
		'mime'  => $emifree_meta['mime_type'] ?? '',
	);
}

$emifree_out = array(
	'generated' => gmdate( 'c' ),
	'media'     => $emifree_manifest,
);

$emifree_manifest_path = 'C:/Users/vpedr/Projects/emifree-elementor/pipeline/src/media-manifest.json';
file_put_contents( $emifree_manifest_path, wp_json_encode( $emifree_out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );

echo "\nmanifest -> {$emifree_manifest_path}\n";
echo 'entries : ' . count( $emifree_manifest ) . "\n";
