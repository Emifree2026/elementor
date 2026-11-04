<?php
/**
 * Inspect the active kit's global class store and the post's class usage.
 *
 *   php probe-kit-classes.php [post_id]
 *
 * Elementor 4 atomic elements reference their CSS by class id
 * (`e-225deb18-a850`). The question this answers: are those class
 * DEFINITIONS inside the document (`_elementor_data`) or in the kit?
 *
 * If they live in the kit, then a snapshot of `_elementor_data` alone is
 * not a complete restore point — the kit has to be captured too, or the
 * page comes back unstyled.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$emifree_post_id = isset( $argv[1] ) ? (int) $argv[1] : 72;

$emifree_kit_id = \Elementor\Plugin::instance()->kits_manager->get_active_id();
echo "active kit id: {$emifree_kit_id}\n";

$emifree_kit_meta = get_post_meta( $emifree_kit_id );
ksort( $emifree_kit_meta );
echo "\nkit meta keys:\n";
foreach ( $emifree_kit_meta as $emifree_key => $emifree_values ) {
	foreach ( $emifree_values as $emifree_value ) {
		printf( "  %-34s %9d bytes\n", $emifree_key, is_string( $emifree_value ) ? strlen( $emifree_value ) : 0 );
	}
}

$emifree_classes_raw = get_post_meta( $emifree_kit_id, '_elementor_global_classes', true );
echo "\n_elementor_global_classes bytes: " . ( is_string( $emifree_classes_raw ) ? strlen( $emifree_classes_raw ) : 0 ) . "\n";

$emifree_classes = is_string( $emifree_classes_raw ) ? json_decode( $emifree_classes_raw, true ) : $emifree_classes_raw;
if ( is_array( $emifree_classes ) ) {
	echo "decoded: " . count( $emifree_classes ) . " entries\n";
	$emifree_sample = 0;
	foreach ( $emifree_classes as $emifree_id => $emifree_def ) {
		if ( $emifree_sample < 3 ) {
			echo "\n--- $emifree_id ---\n";
			echo substr( wp_json_encode( $emifree_def, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ), 0, 900 ) . "\n";
			$emifree_sample++;
		}
	}
}

// Does the document's data contain any style/class definitions of its own?
$emifree_data_raw = get_post_meta( $emifree_post_id, '_elementor_data', true );
echo "\n_elementor_data contains 'styles': " . ( false !== strpos( (string) $emifree_data_raw, '"styles"' ) ? 'YES' : 'NO' ) . "\n";
echo "_elementor_data contains 'variants': " . ( false !== strpos( (string) $emifree_data_raw, '"variants"' ) ? 'YES' : 'NO' ) . "\n";
echo "_elementor_data contains 'custom_css': " . ( false !== strpos( (string) $emifree_data_raw, 'custom_css' ) ? 'YES' : 'NO' ) . "\n";

// The generated per-post CSS file.
$emifree_css_dir = WP_CONTENT_DIR . '/uploads/elementor/css';
$emifree_css_files = glob( $emifree_css_dir . '/post-' . $emifree_post_id . '*.css' );
echo "\ngenerated CSS files for post {$emifree_post_id}:\n";
foreach ( (array) $emifree_css_files as $emifree_file ) {
	printf( "  %-52s %8d bytes\n", basename( $emifree_file ), filesize( $emifree_file ) );
}
$emifree_local_files = glob( $emifree_css_dir . '/local-' . $emifree_post_id . '-frontend-*.css' );
echo "local frontend CSS files:\n";
foreach ( (array) $emifree_local_files as $emifree_file ) {
	printf( "  %-52s %8d bytes\n", basename( $emifree_file ), filesize( $emifree_file ) );
}
