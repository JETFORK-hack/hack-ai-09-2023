import joblib
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from gensim.models.word2vec import Word2Vec
from scipy.sparse import csr_matrix, load_npz
from sklearn.metrics.pairwise import cosine_similarity


folder = './app/deps/model/super/'

pairs_cat = pd.read_csv(folder + 'pairs_categories.csv')
pairs = pd.read_csv(folder + 'pairs.csv')
item2category = pd.read_csv(folder + 'item_id_categ_map.csv', sep=';')
receipt_2idx = pd.read_pickle(folder + 'receipt_2idx.pkl')
item_2idx = pd.read_pickle(folder + 'item_2idx.pkl')
idx_2item = pd.read_pickle(folder + 'idx_2item.pkl')
quantity_total_hist_device = pd.read_csv(folder + 'quantity_total_hist_device.csv')
quantity_total_hist = pd.read_csv(folder + 'quantity_total_hist.csv')

cat_model_cosmetic = Word2Vec.load(folder + 'word2vec.model')
classifier = joblib.load(folder + 'classifier_model.joblib')['model']
als_model = joblib.load(folder + 'candidate_model.joblib')['model']
sparse_receipt_item = load_npz(folder + 'sparse_matrix.npz')

def get_als_embeddings(als_model):
    # извлечение эмбедов из ALS
    receipt_vecs = als_model.user_factors
    item_vecs = als_model.item_factors

    receipt_vecs_csr = csr_matrix(receipt_vecs)
    item_vecs_csr = csr_matrix(item_vecs)

    item_norms = np.sqrt((item_vecs * item_vecs).sum(axis=1))
    return item_norms, item_vecs_csr, item_vecs, receipt_vecs_csr

item_norms, item_vecs_csr, item_vecs, receipt_vecs_csr = get_als_embeddings(als_model)

num_recs = 10
non_features = ["device_id", "item_id", "candidate", "y"]

def recommend_to_receipt(receipt_cat, sparse_user_item,
                         receipt_vecs, item_vecs, idx_2item, num_items=5):

    receipt_interactions = sparse_user_item[receipt_cat, :].toarray()

    receipt_interactions = receipt_interactions.reshape(-1) + 1
    receipt_interactions[receipt_interactions > 1] = 0

    rec_vector = receipt_vecs[receipt_cat, :].dot(item_vecs.T).toarray()

    recommend_vector = (receipt_interactions * rec_vector)[0]

    item_idx = np.argsort(recommend_vector)[::-1][:num_items]

    result = []

    for idx in item_idx:
        result.append((idx_2item[idx], recommend_vector[idx]))

    return result


def recommend_to_items(items_cat, item_norms, item_vecs, idx_2item, num_items=5):

    scores = item_vecs.dot(item_vecs[items_cat].T).T  / item_norms.reshape(1, -1)
    top_idx = np.argpartition(scores, -num_items, axis=1)[:, -(num_items+1):]
    scores = np.array([scores[idx, row] for idx, row in enumerate(top_idx)])
    scores = scores / item_norms[items_cat].reshape(-1, 1)
    result = []
    for i in sorted(zip(top_idx.reshape(-1), scores.reshape(-1)), key=lambda x: -x[1]):
      if i[0] not in items_cat and idx_2item[i[0]] not in [j[0] for j in result]:
        result.append((idx_2item[i[0]], i[1]))

    return result[:num_items]


def predict(item_ids, device_id):
    predict = pd.DataFrame([device_id], columns = ["device_id"])
    predict["item_id"] = [item_ids]


    predict["receipt_cat"] = predict["item_id"].map(receipt_2idx.get)
    predict["item_cat"] = predict["item_id"].apply(lambda x: [item_2idx.get(i) for i in x if i in item_2idx])
    predict["preds"] = predict.apply(
        lambda x:
        recommend_to_receipt(int(x["receipt_cat"]), sparse_receipt_item, receipt_vecs_csr, item_vecs_csr, idx_2item, num_recs)
        if not pd.isnull(x["receipt_cat"])
        else recommend_to_items(x["item_cat"], item_norms, item_vecs, idx_2item, num_recs), axis=1)

    predict = predict \
      .drop(["receipt_cat", "item_cat"], axis=1) \
      .explode("preds") \
      .explode("item_id") \
      .reset_index(drop=True)

    predict = pd.concat([predict, pd.DataFrame(predict["preds"].tolist(), columns=["candidate", "als_score"])], axis=1) \
      .drop(["preds"], axis=1)

    predict = predict.merge(pairs, on=["item_id", "candidate"], how="left") \
      .merge(quantity_total_hist_device.rename(columns={"item_id": "candidate"}), on=["device_id", "candidate"], how="left") \
      .merge(quantity_total_hist.rename(columns={"item_id": "candidate"}), on=["candidate"], how="left")

    predict = predict \
      .merge(item2category, on=["item_id"], how="left") \
      .merge(item2category.rename(columns={"item_id": "candidate", "category_noun": "category_noun_candidate"}), on=["candidate"], how="left") \
      .merge(pairs_cat, on=["category_noun", "category_noun_candidate"], how="left")

    predict.loc[predict["candidate"].notna(), "w2v_sim"] = predict[predict["candidate"].notna()].apply(lambda x: 
                                              cosine_similarity(cat_model_cosmetic.wv.get_vector(x["category_noun"]).reshape(1, -1),
                                                                cat_model_cosmetic.wv.get_vector(x["category_noun_candidate"]).reshape(1, -1))[0, 0],
                                              axis=1
                                              )
    predict.drop(["category_noun", "category_noun_candidate"], axis=1, inplace=True)
    predict["proba"] = (classifier.predict_proba(predict.drop([i for i in non_features if i != "y"], axis=1).fillna(0))[:, 1] * 100).round(2)

    return predict.sort_values(by='proba', ascending=False).head(1)['candidate'].values[0]
