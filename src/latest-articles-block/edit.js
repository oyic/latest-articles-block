/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __, sprintf } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
        PanelBody,
        SelectControl,
        ToggleControl,
        Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import './editor.scss';

/**
 * Editor view: sidebar settings plus a placeholder for the block.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Saved block settings.
 * @param {Function} props.setAttributes Updates block settings.
 * @return {Element} Element to render.
 */
export default function Edit( { attributes, setAttributes } ) {
        const { categoryId, showCategoryLabel, showExcerpt } = attributes;

        // All post categories via the REST API. null while loading.
        const categories = useSelect(
                ( select ) =>
                        select( coreStore ).getEntityRecords( 'taxonomy', 'category', {
                                per_page: -1,
                                orderby: 'name',
                                order: 'asc',
                                _fields: 'id,name,count',
                        } ),
                []
        );

        const categoryOptions = [
                { label: __( 'Select a category', 'latest-articles-block' ), value: 0 },
                ...( categories ?? [] ).map( ( category ) => ( {
                        label: `${ decodeEntities( category.name ) } (${ category.count })`,
                        value: category.id,
                } ) ),
        ];

        const selected = categories?.find( ( c ) => c.id === categoryId );

        return (
                <>
                        <InspectorControls>
                                <PanelBody title={ __( 'Settings', 'latest-articles-block' ) }>
                                        { categories === null ? (
                                                <Spinner />
                                        ) : (
                                                <SelectControl
                                                        __next40pxDefaultSize
                                                        __nextHasNoMarginBottom
                                                        label={ __( 'Category', 'latest-articles-block' ) }
                                                        value={ categoryId }
                                                        options={ categoryOptions }
                                                        onChange={ ( value ) =>
                                                                setAttributes( {
                                                                        categoryId: parseInt( value, 10 ),
                                                                } )
                                                        }
                                                />
                                        ) }
                                        <ToggleControl
                                                __nextHasNoMarginBottom
                                                label={ __(
                                                        'Display category label',
                                                        'latest-articles-block'
                                                ) }
                                                checked={ showCategoryLabel }
                                                onChange={ ( value ) =>
                                                        setAttributes( { showCategoryLabel: value } )
                                                }
                                        />
                                        <ToggleControl
                                                __nextHasNoMarginBottom
                                                label={ __(
                                                        'Show subtext (excerpt)',
                                                        'latest-articles-block'
                                                ) }
                                                help={ __(
                                                        'Shown on the featured article only.',
                                                        'latest-articles-block'
                                                ) }
                                                checked={ showExcerpt }
                                                onChange={ ( value ) =>
                                                        setAttributes( { showExcerpt: value } )
                                                }
                                        />
                                </PanelBody>
                        </InspectorControls>
                        <div { ...useBlockProps() }>
                                <p>
                                        { selected
                                                ? sprintf(
                                                                /* translators: %s: category name */
                                                                __(
                                                                        'Latest articles from: %s',
                                                                        'latest-articles-block'
                                                                ),
                                                                decodeEntities( selected.name )
                                                  )
                                                : __(
                                                                'Choose a category in the block settings.',
                                                                'latest-articles-block'
                                                  ) }
                                </p>
                        </div>
                </>
        );
}