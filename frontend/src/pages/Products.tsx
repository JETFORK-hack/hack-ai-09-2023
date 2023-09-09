import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { AutoComplete, Button, Divider, Form, Input, List, Segmented, Space, Spin, Typography, message } from 'antd';
import axios from 'axios';
import { basePath } from '../providers/env';
import { ReactNode, useCallback, useEffect, useState } from 'react';

import debounce from 'lodash.debounce';

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
                dropdownMatchSelectWidth={252}
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
                    <br />
                    <div style={{ textAlign: 'center' }}>
                        <Button type="primary">Получить рекомендации</Button>
                    </div>
                </>
            )}
            <br />
            <br />
            <br />
        </>
    )
};
