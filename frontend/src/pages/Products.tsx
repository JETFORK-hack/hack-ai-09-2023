import { DislikeOutlined, LikeOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { AutoComplete, Button, Card, Divider, Form, Input, List, Segmented, Space, Spin, Typography, message } from 'antd';
import axios from 'axios';
import { basePath } from '../providers/env';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import "react-multi-carousel/lib/styles.css";

import debounce from 'lodash.debounce';
import Carousel from 'react-multi-carousel';

const selectedTypeOptions = [
    {
        value: 'cosmetic',
        label: 'Косметика',
    },
    {
        value: 'super',
        label: 'Супермаркет',
    },
]

interface ProductsGet {
    item_id: number;
    name: string;
    type: string;
}

interface ProductsGetExtended extends ProductsGet {
    value: number;
    label: JSX.Element | string;
}

const renderItem = (item: ProductsGet): ProductsGetExtended => ({
    ...item,
    value: item.item_id,
    label: (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
            }}
        >
            {item.name}
        </div>
    ),
});

export const Products = (): JSX.Element => {
    const [options, setOptions] = useState<ProductsGetExtended[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedItems, setSelectedItems] = useState<ProductsGet[]>([]);
    const [searchString, setSearchString] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string | number>(selectedTypeOptions[0].value);


    const handleSearch = (value: string) => {
        console.log('Received values of form:', value, 'selectedType', selectedType);
        setOptions([]);
        if (!value) return;
        setIsLoading(true);
        axios.get<ProductsGet[]>(basePath + '/api/v1/matching/find_by_name', { params: { q: value, type: selectedType } })
            .then((response) => {
                console.log(response.data)
                setOptions(response.data.map(renderItem));
            })
            .catch(() => {
                message.error('Загрузка не удалась.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const debouncedSearchHandler = useCallback(
        debounce(handleSearch, 550)
        , [selectedType]);

    // const debouncedSearchHandler = useEffect(
    //     debounce(handleSearch, 550), [searchString]);

    const onSearch = (searchText: string) => {
        setSearchString(searchText);
        debouncedSearchHandler(searchText);
    };

    const onSelect = (_: string, option: ProductsGet) => {
        console.log('onSelect', option);
        setSearchString('');
        setOptions([]);
        setSelectedItems([...selectedItems, option]);
    };

    const removeItem = (item: ProductsGet) => {
        setSelectedItems(selectedItems.filter((i) => i.item_id !== item.item_id));
    };

    const handleChangeSelectedType = (value: string | number) => {
        console.log('handleChangeSelectedType', value)
        setSelectedType(value);
        setOptions([]);
        setSearchString('');
    };

    return (
        <>
            <h1>Товары</h1>
            <Typography.Text>Тип:{' '}</Typography.Text>
            <Segmented options={selectedTypeOptions}
                value={selectedType}
                onChange={handleChangeSelectedType}
                disabled={selectedItems.length > 0}
            />
            <br />
            <br />
            <AutoComplete
                style={{ width: 500 }}
                options={options}
                // onSearch={debouncedSearchHandler}
                onSearch={onSearch}
                onSelect={onSelect}
                notFoundContent={
                    <div style={{ textAlign: 'center' }}>{isLoading ? <Spin size="small" /> : <Typography.Text type='secondary'>Ничего не найдено</Typography.Text>}
                    </div>}
                value={searchString}
            >
                <Input.Search size="large" placeholder="Название или id товара" enterButton loading={isLoading} />
            </AutoComplete>

            {selectedItems.length > 0 && (
                <>
                    <br />
                    <br />
                    <br />
                    <Divider>Выбранные товары</Divider>
                    <List
                        bordered
                        dataSource={selectedItems}
                        renderItem={(item) => (
                            <List.Item actions={[<a onClick={() => removeItem(item)}>Убрать</a>]}>
                                <Typography.Text>{item.name}</Typography.Text>
                            </List.Item>
                        )}
                    />
                    <br />
                </>
            )}
            <br />
            <br />
            {selectedItems.length > 0 &&
                <>
                    <Divider>Рекомендации</Divider>
                    <br />
                    <Carousel
                        additionalTransfrom={0}
                        // arrows
                        autoPlay
                        autoPlaySpeed={3500}
                        // centerMode={false}
                        // className=""
                        // containerClass="container-with-dots"
                        // dotListClass=""
                        draggable
                        focusOnSelect={false}
                        infinite={false}
                        // itemClass=""
                        keyBoardControl
                        // minimumTouchDrag={80}
                        pauseOnHover
                        renderArrowsWhenDisabled={false}
                        renderButtonGroupOutside={false}
                        renderDotsOutside={false}
                        responsive={{
                            superLargeDesktop: {
                                breakpoint: { max: 4000, min: 3000 },
                                items: 5,
                                partialVisibilityGutter: 40,
                            },
                            desktop: {
                                breakpoint: { max: 3000, min: 1700 },
                                items: 4,
                                partialVisibilityGutter: 30,
                            },
                            desktopMini: {
                                breakpoint: { max: 1700, min: 1024 },
                                partialVisibilityGutter: 30,
                                items: 3,
                            },
                            tablet: {
                                breakpoint: { max: 1024, min: 624 },
                                items: 2
                            },
                            mobile: {
                                breakpoint: { max: 624, min: 0 },
                                items: 1
                            }
                        }}
                        slidesToSlide={2}
                    // swipeable
                    >
                        <Card
                            hoverable
                            style={{ width: 240 }}
                            actions={[
                                <LikeOutlined onClick={() => message.success('Отзыв принят.')} key='good' />,
                                <DislikeOutlined onClick={() => message.success('Отзыв принят.')} key='bad' />
                            ]}
                            cover={<img alt="example" src="https://images.unsplash.com/photo-1549396535-c11d5c55b9df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" />}
                        >
                            <Card.Meta title="Наименование товара" description="Описание товара" />
                        </Card>
                        {/* <Card
                            hoverable
                            style={{ width: 240 }}
                            actions={[
                                <LikeOutlined onClick={() => message.success('Отзыв принят.')} key='good' />,
                                <DislikeOutlined onClick={() => message.success('Отзыв принят.')} key='bad' />
                            ]}
                            cover={<img alt="example" src="https://images.unsplash.com/photo-1549396535-c11d5c55b9df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" />}
                        >
                            <Card.Meta title="Наименование товара" description="Описание товара" />
                        </Card>

                        <Card
                            hoverable
                            style={{ width: 240 }}
                            actions={[
                                <LikeOutlined onClick={() => message.success('Отзыв принят.')} key='good' />,
                                <DislikeOutlined onClick={() => message.success('Отзыв принят.')} key='bad' />
                            ]}
                            cover={<img alt="example" src="https://images.unsplash.com/photo-1549396535-c11d5c55b9df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" />}
                        >
                            <Card.Meta title="Наименование товара" description="Описание товара" />
                        </Card>

                        <Card
                            hoverable
                            style={{ width: 240 }}
                            actions={[
                                <LikeOutlined onClick={() => message.success('Отзыв принят.')} key='good' />,
                                <DislikeOutlined onClick={() => message.success('Отзыв принят.')} key='bad' />
                            ]}
                            cover={<img alt="example" src="https://images.unsplash.com/photo-1549396535-c11d5c55b9df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" />}
                        >
                            <Card.Meta title="Наименование товара" description="Описание товара" />
                        </Card>
                        <Card
                            hoverable
                            style={{ width: 240 }}
                            actions={[
                                <LikeOutlined onClick={() => message.success('Отзыв принят.')} key='good' />,
                                <DislikeOutlined onClick={() => message.success('Отзыв принят.')} key='bad' />
                            ]}
                            cover={<img alt="example" src="https://images.unsplash.com/photo-1549396535-c11d5c55b9df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" />}
                        >
                            <Card.Meta title="Наименование товара" description="Описание товара" />
                        </Card>
                        <Card
                            hoverable
                            style={{ width: 240 }}
                            actions={[
                                <LikeOutlined onClick={() => message.success('Отзыв принят.')} key='good' />,
                                <DislikeOutlined onClick={() => message.success('Отзыв принят.')} key='bad' />
                            ]}
                            cover={<img alt="example" src="https://images.unsplash.com/photo-1549396535-c11d5c55b9df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" />}
                        >
                            <Card.Meta title="Наименование товара" description="Описание товара" />
                        </Card> */}
                    </Carousel>
                    <br />
                </>
            }
        </>
    )
};
