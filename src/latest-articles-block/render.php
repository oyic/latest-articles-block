<?php
/**
 * Server-side render for the Latest Articles block.
 *
 * Rendering in PHP means the block always shows the newest posts:
 * nothing is saved in post content except the block's settings.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block inner content (unused).
 * @var WP_Block $block      Block instance.
 */

$category_id  = isset( $attributes['categoryId'] ) ? absint( $attributes['categoryId'] ) : 0;
$show_label   = ! empty( $attributes['showCategoryLabel'] );
$show_excerpt = ! empty( $attributes['showExcerpt'] );

// No category chosen, or it was deleted: render nothing on the front end.
if ( ! $category_id ) {
        return;
}
$category = get_term( $category_id, 'category' );
if ( ! $category instanceof WP_Term ) {
        return;
}

$query = new WP_Query(
        array(
                'cat'                 => $category_id,
                'post_type'           => 'post',
                'post_status'         => 'publish',
                'posts_per_page'      => 5,
                'orderby'             => 'date',
                'order'               => 'DESC',
                'ignore_sticky_posts' => true,
                'no_found_rows'       => true,
        )
);

// Empty category: render nothing.
if ( ! $query->have_posts() ) {
        return;
}

$items = $query->posts;
$hero  = array_shift( $items );
$label = $show_label ? $category->name : '';
?>
<div <?php echo get_block_wrapper_attributes(); ?>>
        <article class="wp-block-oyic-latest-articles-block__hero">
                <div class="wp-block-oyic-latest-articles-block__hero-media">
                        <?php if ( has_post_thumbnail( $hero ) ) : ?>
                                <?php echo wp_get_attachment_image( get_post_thumbnail_id( $hero ), 'full', false, array( 'alt' => '' ) ); ?>
                        <?php else : ?>
                                <span class="wp-block-oyic-latest-articles-block__placeholder" aria-hidden="true"></span>
                        <?php endif; ?>
                </div>
                <?php if ( $label ) : ?>
                        <p class="wp-block-oyic-latest-articles-block__label"><?php echo esc_html( $label ); ?></p>
                <?php endif; ?>
                <h2 class="wp-block-oyic-latest-articles-block__title">
                        <a href="<?php echo esc_url( get_permalink( $hero ) ); ?>"><?php echo esc_html( get_the_title( $hero ) ); ?></a>
                </h2>
                <?php if ( $show_excerpt && has_excerpt( $hero ) ) : ?>
                        <p class="wp-block-oyic-latest-articles-block__excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt( $hero ), 25 ) ); ?></p>
                <?php endif; ?>
        </article>

        <?php if ( $items ) : ?>
                <div class="wp-block-oyic-latest-articles-block__grid">
                        <?php foreach ( $items as $item ) : ?>
                                <article class="wp-block-oyic-latest-articles-block__card">
                                        <div class="wp-block-oyic-latest-articles-block__thumb">
                                                <?php if ( has_post_thumbnail( $item ) ) : ?>
                                                        <?php echo wp_get_attachment_image( get_post_thumbnail_id( $item ), 'medium', false, array( 'alt' => '' ) ); ?>
                                                <?php else : ?>
                                                        <span class="wp-block-oyic-latest-articles-block__placeholder" aria-hidden="true"></span>
                                                <?php endif; ?>
                                        </div>
                                        <div class="wp-block-oyic-latest-articles-block__card-body">
                                                <?php if ( $label ) : ?>
                                                        <p class="wp-block-oyic-latest-articles-block__label"><?php echo esc_html( $label ); ?></p>
                                                <?php endif; ?>
                                                <h3 class="wp-block-oyic-latest-articles-block__title">
                                                        <a href="<?php echo esc_url( get_permalink( $item ) ); ?>"><?php echo esc_html( get_the_title( $item ) ); ?></a>
                                                </h3>
                                        </div>
                                </article>
                        <?php endforeach; ?>
                </div>
        <?php endif; ?>
</div>