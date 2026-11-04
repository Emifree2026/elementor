<?php
/**
 * List the SVG attachments in the Media Library.
 *
 *   php probe-media.php
 *
 * The product pages need arrow / download icons. This shows what already
 * exists so nothing gets uploaded twice.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$emifree_attachments = get_posts(
	array(
		'post_type'      => 'attachment',
		'post_status'    => 'inherit',
		'posts_per_page' => 300,
		'orderby'        => 'ID',
		'order'          => 'ASC',
	)
);

printf( "%-6s %-34s %-12s %s\n", 'ID', 'file', 'mime', 'title' );
foreach ( $emifree_attachments as $emifree_a ) {
	$emifree_mime = get_post_mime_type( $emifree_a->ID );
	$emifree_file = get_attached_file( $emifree_a->ID );
	printf(
		"%-6d %-34s %-12s %s\n",
		$emifree_a->ID,
		basename( $emifree_file ?: '?' ),
		$emifree_mime ?: '-',
		$emifree_a->post_title
	);
}
