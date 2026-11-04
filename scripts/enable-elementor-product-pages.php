<?php
/**
 * Mark the six product pages as "built with Elementor".
 *
 *   php enable-elementor-product-pages.php [post_id ...]
 *
 * WHY THIS EXISTS
 * ---------------
 * The MCP `elementor-build-composition` ability stages the tree into an
 * autosave row and `elementor-publish-document` promotes it with
 * `Revisions_Manager::restore_revision()`. That method refuses to copy the
 * staged `_elementor_data` when the revision is not flagged as an Elementor
 * document:
 *
 *     $is_built_with_elementor = $revision->is_built_with_elementor();
 *     $parent->set_is_built_with_elementor( $is_built_with_elementor );
 *     if ( ! $is_built_with_elementor ) {
 *         return;                       // <-- silent no-op
 *     }
 *     Plugin::$instance->db->copy_elementor_meta( $revision_id, $parent_id );
 *
 * A page that was authored in the Classic/Gutenberg editor has no
 * `_elementor_edit_mode` meta, so the promotion throws the staged tree away
 * and the build appears to succeed while nothing lands. The Elementor editor
 * itself sets the same flag when a page is opened in the builder
 * (`core/documents-manager.php`, `core/editor/editor.php`), so this script
 * calls that exact API — it does not write the meta key by hand.
 *
 * The script is idempotent: pages that are already flagged are left alone.
 * It never touches `_elementor_data`, `_elementor_css` or the element cache.
 *
 * @package emifree-elementor
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

if ( ! class_exists( '\Elementor\Plugin' ) ) {
	fwrite( STDERR, "Elementor is not active — cannot mark the pages.\n" );
	exit( 1 );
}

$emifree_ids = array_slice( $argv, 1 );
if ( ! $emifree_ids ) {
	$emifree_ids = array( 44, 45, 46, 47, 48, 49 );
}

$emifree_documents = \Elementor\Plugin::instance()->documents;

foreach ( $emifree_ids as $emifree_id ) {
	$emifree_id = (int) $emifree_id;
	$emifree_post = get_post( $emifree_id );

	if ( ! $emifree_post ) {
		printf( "post %-4d  (missing)\n", $emifree_id );
		continue;
	}

	$emifree_document = $emifree_documents->get( $emifree_id );
	if ( ! $emifree_document ) {
		printf( "post %-4d  %-28s  (no Elementor document)\n", $emifree_id, $emifree_post->post_name );
		continue;
	}

	if ( $emifree_document->is_built_with_elementor() ) {
		printf( "post %-4d  %-28s  already built with Elementor\n", $emifree_id, $emifree_post->post_name );
		continue;
	}

	$emifree_document->set_is_built_with_elementor( true );

	// set_is_built_with_elementor() writes the meta through update_metadata(),
	// so the value is on the row now — assert it rather than trust the call.
	$emifree_mode = get_post_meta( $emifree_id, '_elementor_edit_mode', true );

	if ( 'builder' === $emifree_mode ) {
		printf( "post %-4d  %-28s  marked as built with Elementor\n", $emifree_id, $emifree_post->post_name );
	} else {
		printf( "post %-4d  %-28s  FAILED (mode is '%s')\n", $emifree_id, $emifree_post->post_name, $emifree_mode );
	}
}
