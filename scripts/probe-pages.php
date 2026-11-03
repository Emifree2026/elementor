<?php
/**
 * List every published page/post with its Elementor status and template.
 *
 *   php probe-pages.php
 *
 * Read-only. Answers "which document lives where" for the migration.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$posts = get_posts(
	array(
		'post_type'   => array( 'page', 'post' ),
		'numberposts' => 100,
		'post_status' => 'publish',
		'orderby'     => 'ID',
	)
);

printf( "%-5s %-8s %-36s %-6s %-9s %s\n", 'ID', 'type', 'post_name', 'parent', 'elementor', 'template' );
foreach ( $posts as $p ) {
	$el  = get_post_meta( $p->ID, '_elementor_edit_mode', true );
	$tpl = get_post_meta( $p->ID, '_wp_page_template', true );
	printf(
		"%-5d %-8s %-36s %-6d %-9s %s\n",
		$p->ID,
		$p->post_type,
		$p->post_name,
		$p->post_parent,
		$el ? $el : '-',
		$tpl ? $tpl : '-'
	);
}

echo "\n--- front page ---\n";
printf( "show_on_front : %s\n", get_option( 'show_on_front' ) );
printf( "page_on_front  : %s\n", get_option( 'page_on_front' ) ?: '(none)' );
printf( "page_for_posts : %s\n", get_option( 'page_for_posts' ) ?: '(none)' );

echo "\n--- rewrite rules for the product routes ---\n";
foreach ( (array) get_option( 'rewrite_rules', array() ) as $pattern => $target ) {
	if ( false !== strpos( $pattern, 'emifree_product' ) ) {
		printf( "%-46s => %s\n", $pattern, $target );
	}
}

echo "\n--- theme URL rewrite for /en/ ---\n";
foreach ( (array) get_option( 'rewrite_rules', array() ) as $pattern => $target ) {
	if ( preg_match( '#\^en/#', $pattern ) ) {
		printf( "%-46s => %s\n", $pattern, $target );
	}
}
